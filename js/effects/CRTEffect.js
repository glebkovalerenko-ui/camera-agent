import VideoRecorder from '../utils/VideoRecorder.js';

class CRTEffect {
    constructor(targetCanvas, container, audioManager = null) {
        this.gameCanvas = targetCanvas;
        
        // Создаем WebGL канвас
        this.glCanvas = document.createElement('canvas');
        // Фиксируем внутреннее разрешение 1:1 с игровым
        this.glCanvas.width = 1024;
        this.glCanvas.height = 1024;
        
        // Стили для наложения поверх игры
        this.glCanvas.style.position = 'absolute';
        this.glCanvas.style.pointerEvents = 'none'; // Клики проходят сквозь
        this.glCanvas.style.transformOrigin = '0 0';
        
        container.appendChild(this.glCanvas);

        this.gl = this.glCanvas.getContext('webgl2', {
            premultipliedAlpha: false,
            alpha: false,
            antialias: false
        });

        if (!this.gl) throw new Error("WebGL2 not supported");

        this.config = {
            scanline: { intensity: 0.28, count: 1024.0, rollingSpeed: 10.3 },
            screenEffects: { vignetteStrength: 0.22, brightness: 1.1, curvature: 0.1 },
            colorEffects: { rgbShift: 0.0015 },
            blur: { horizontal: 0.4 },
            distortion: { flickerSpeed: 8.0, flickerIntensity: 0.03, noiseAmount: 0.05 }
        };

        this.createShaders();
        this.createBuffers();
        this.createTexture();
        this.loadConfig();

        this.videoRecorder = new VideoRecorder(this.glCanvas, audioManager);
        this.setupRecordingControls();
    }

    // Синхронизация CSS-размеров с основным канвасом
    syncStyle(sourceCanvas) {
        this.glCanvas.style.width = sourceCanvas.style.width;
        this.glCanvas.style.height = sourceCanvas.style.height;
        this.glCanvas.style.left = sourceCanvas.style.left;
        this.glCanvas.style.top = sourceCanvas.style.top;
        this.glCanvas.style.display = sourceCanvas.style.display === 'none' ? 'none' : 'block';
    }

    async loadConfig() {
        try {
            const response = await fetch('./config/crt-effect.json');
            if (response.ok) this.config = await response.json();
        } catch (err) {}
    }

    createShaders() {
        // Простой Vertex Shader
        const vsSource = `#version 300 es
            in vec2 a_position;
            in vec2 a_texCoord;
            out vec2 v_texCoord;
            void main() {
                gl_Position = vec4(a_position, 0, 1);
                v_texCoord = a_texCoord;
            }`;

        // Fragment Shader (без изменений логики, только uniform map)
        const fsSource = `#version 300 es
            precision highp float;
            
            uniform sampler2D u_image;
            uniform float u_time;
            
            // Config uniforms
            uniform float u_scanlineIntensity;
            uniform float u_scanlineCount;
            uniform float u_rollingSpeed;
            uniform float u_vignetteStrength;
            uniform float u_brightness;
            uniform float u_curvature;
            uniform float u_rgbShift;
            uniform float u_flickerSpeed;
            uniform float u_flickerIntensity;
            uniform float u_noiseAmount;
            
            in vec2 v_texCoord;
            out vec4 outColor;
            
            float rand(vec2 co) {
                return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            void main() {
                vec2 uv = v_texCoord;
                
                // Curvature
                vec2 curve_uv = uv * 2.0 - 1.0;
                vec2 offset = curve_uv.yx * curve_uv.yx * vec2(u_curvature);
                curve_uv += curve_uv * offset;
                uv = curve_uv * 0.5 + 0.5;

                // Черные края за пределами изгиба
                if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                    outColor = vec4(0.0, 0.0, 0.0, 1.0);
                    return;
                }

                // Scanline
                float scanline = sin(uv.y * u_scanlineCount + u_time * u_rollingSpeed);
                scanline = scanline * 0.5 + 0.5;

                // RGB Shift
                float shift = u_rgbShift;
                vec2 rUV = uv - vec2(shift, 0.0);
                vec2 gUV = uv;
                vec2 bUV = uv + vec2(shift, 0.0);

                vec3 color;
                color.r = texture(u_image, rUV).r;
                color.g = texture(u_image, gUV).g;
                color.b = texture(u_image, bUV).b;

                // Effects chain
                color *= u_brightness;
                color *= 1.0 - (scanline * u_scanlineIntensity);
                color *= 1.0 - length(curve_uv) * u_vignetteStrength;
                color *= 1.0 - (sin(u_time * u_flickerSpeed) * u_flickerIntensity);
                
                // Noise
                float noise = rand(uv + vec2(u_time * 0.001));
                color += (noise - 0.5) * u_noiseAmount;

                outColor = vec4(color, 1.0);
            }`;

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
        this.program = this.createProgram(vertexShader, fragmentShader);

        this.positionLoc = this.gl.getAttribLocation(this.program, 'a_position');
        this.texCoordLoc = this.gl.getAttribLocation(this.program, 'a_texCoord');
        this.timeLoc = this.gl.getUniformLocation(this.program, 'u_time');
        
        this.uLocs = {
            scanlineIntensity: this.gl.getUniformLocation(this.program, 'u_scanlineIntensity'),
            scanlineCount: this.gl.getUniformLocation(this.program, 'u_scanlineCount'),
            rollingSpeed: this.gl.getUniformLocation(this.program, 'u_rollingSpeed'),
            vignetteStrength: this.gl.getUniformLocation(this.program, 'u_vignetteStrength'),
            brightness: this.gl.getUniformLocation(this.program, 'u_brightness'),
            curvature: this.gl.getUniformLocation(this.program, 'u_curvature'),
            rgbShift: this.gl.getUniformLocation(this.program, 'u_rgbShift'),
            flickerSpeed: this.gl.getUniformLocation(this.program, 'u_flickerSpeed'),
            flickerIntensity: this.gl.getUniformLocation(this.program, 'u_flickerIntensity'),
            noiseAmount: this.gl.getUniformLocation(this.program, 'u_noiseAmount')
        };
    }

    createBuffers() {
        const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
        this.texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
    }

    createTexture() {
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) return null;
        return shader;
    }

    createProgram(vs, fs) {
        if (!vs || !fs) return null;
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) return null;
        return program;
    }

    render(time) {
        if (!this.program || !this.texture) return;
        const gl = this.gl;
        
        gl.viewport(0, 0, 1024, 1024);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.program);

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        // Берем изображение с ИГРОВОГО канваса (который 1024x1024)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.gameCanvas);

        gl.uniform1f(this.timeLoc, time * 0.001);

        const c = this.config;
        gl.uniform1f(this.uLocs.scanlineIntensity, c.scanline.intensity);
        gl.uniform1f(this.uLocs.scanlineCount, c.scanline.count);
        gl.uniform1f(this.uLocs.rollingSpeed, c.scanline.rollingSpeed);
        gl.uniform1f(this.uLocs.vignetteStrength, c.screenEffects.vignetteStrength);
        gl.uniform1f(this.uLocs.brightness, c.screenEffects.brightness);
        gl.uniform1f(this.uLocs.curvature, c.screenEffects.curvature);
        gl.uniform1f(this.uLocs.rgbShift, c.colorEffects.rgbShift);
        gl.uniform1f(this.uLocs.flickerSpeed, c.distortion.flickerSpeed);
        gl.uniform1f(this.uLocs.flickerIntensity, c.distortion.flickerIntensity);
        gl.uniform1f(this.uLocs.noiseAmount, c.distortion.noiseAmount);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(this.positionLoc);
        gl.vertexAttribPointer(this.positionLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.texCoordLoc);
        gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    setupRecordingControls() {
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r') {
                this.videoRecorder.isRecording() ? this.videoRecorder.stopRecording() : this.videoRecorder.startRecording();
            }
        });
    }
}

export default CRTEffect;