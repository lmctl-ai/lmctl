package com.lmctl.demo.teavm;

import org.teavm.jso.dom.html.HTMLCanvasElement;
import org.teavm.jso.typedarrays.Float32Array;
import org.teavm.jso.webgl.WebGLBuffer;
import org.teavm.jso.webgl.WebGLProgram;
import org.teavm.jso.webgl.WebGLRenderingContext;
import org.teavm.jso.webgl.WebGLShader;
import org.teavm.jso.webgl.WebGLUniformLocation;

final class WebGlDemo {
    private static final float[][] POSITIONS = {
            { -1, -1, -1 }, { 1, -1, -1 }, { 1, 1, -1 }, { -1, 1, -1 },
            { -1, -1, 1 }, { 1, -1, 1 }, { 1, 1, 1 }, { -1, 1, 1 }
    };
    private static final int[][] FACES = {
            { 0, 3, 2, 0, 2, 1 }, { 4, 5, 6, 4, 6, 7 },
            { 0, 4, 7, 0, 7, 3 }, { 1, 2, 6, 1, 6, 5 },
            { 3, 7, 6, 3, 6, 2 }, { 0, 1, 5, 0, 5, 4 }
    };
    private static final float[][] COLORS = {
            { 0.24f, 0.48f, 0.85f }, { 0.55f, 0.85f, 0.77f },
            { 0.45f, 0.35f, 0.78f }, { 0.85f, 0.48f, 0.38f },
            { 0.32f, 0.68f, 0.85f }, { 0.78f, 0.66f, 0.3f }
    };

    private WebGlDemo() {
    }

    static void draw(HTMLCanvasElement canvas) {
        WebGLRenderingContext gl = canvas.getContext("webgl").cast();
        if (gl == null) {
            throw new IllegalStateException("WebGL is not available");
        }
        WebGLProgram program = createProgram(gl);
        gl.useProgram(program);

        float[] vertices = new float[FACES.length * 6 * 6];
        int offset = 0;
        for (int face = 0; face < FACES.length; face++) {
            for (int index : FACES[face]) {
                for (int axis = 0; axis < 3; axis++) {
                    vertices[offset++] = POSITIONS[index][axis];
                }
                for (int channel = 0; channel < 3; channel++) {
                    vertices[offset++] = COLORS[face][channel];
                }
            }
        }

        WebGLBuffer buffer = gl.createBuffer();
        gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, buffer);
        gl.bufferData(WebGLRenderingContext.ARRAY_BUFFER, Float32Array.copyFromJavaArray(vertices),
                WebGLRenderingContext.STATIC_DRAW);
        int position = gl.getAttribLocation(program, "aPosition");
        int color = gl.getAttribLocation(program, "aColor");
        gl.enableVertexAttribArray(position);
        gl.enableVertexAttribArray(color);
        gl.vertexAttribPointer(position, 3, WebGLRenderingContext.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(color, 3, WebGLRenderingContext.FLOAT, false, 24, 12);

        WebGLUniformLocation aspect = gl.getUniformLocation(program, "uAspect");
        gl.uniform1f(aspect, (float) canvas.getWidth() / canvas.getHeight());
        gl.viewport(0, 0, canvas.getWidth(), canvas.getHeight());
        gl.enable(WebGLRenderingContext.DEPTH_TEST);
        gl.clearColor(0.043f, 0.063f, 0.125f, 1);
        gl.clear(WebGLRenderingContext.COLOR_BUFFER_BIT | WebGLRenderingContext.DEPTH_BUFFER_BIT);
        gl.drawArrays(WebGLRenderingContext.TRIANGLES, 0, 36);
        gl.flush();
    }

    private static WebGLProgram createProgram(WebGLRenderingContext gl) {
        WebGLShader vertex = compileShader(gl, WebGLRenderingContext.VERTEX_SHADER,
                "attribute vec3 aPosition;"
                + "attribute vec3 aColor;"
                + "uniform float uAspect;"
                + "varying vec3 vColor;"
                + "void main() {"
                + " float cy = cos(0.65); float sy = sin(0.65);"
                + " vec3 p = vec3(cy * aPosition.x + sy * aPosition.z, aPosition.y,"
                + " -sy * aPosition.x + cy * aPosition.z);"
                + " float cx = cos(0.45); float sx = sin(0.45);"
                + " p = vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);"
                + " p.z -= 4.5;"
                + " gl_Position = vec4(p.x * 1.25 / uAspect, p.y * 1.25, p.z + 2.0, -p.z);"
                + " vColor = aColor;"
                + "}");
        WebGLShader fragment = compileShader(gl, WebGLRenderingContext.FRAGMENT_SHADER,
                "precision mediump float; varying vec3 vColor;"
                + "void main() { gl_FragColor = vec4(vColor, 1.0); }");
        WebGLProgram program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        if (!gl.getProgramParameterb(program, WebGLRenderingContext.LINK_STATUS)) {
            throw new IllegalStateException("WebGL link failed: " + gl.getProgramInfoLog(program));
        }
        return program;
    }

    private static WebGLShader compileShader(WebGLRenderingContext gl, int type, String source) {
        WebGLShader shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameterb(shader, WebGLRenderingContext.COMPILE_STATUS)) {
            throw new IllegalStateException("WebGL shader failed: " + gl.getShaderInfoLog(shader));
        }
        return shader;
    }
}
