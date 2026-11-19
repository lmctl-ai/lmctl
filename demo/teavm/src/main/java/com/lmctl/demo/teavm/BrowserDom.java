package com.lmctl.demo.teavm;

import io.lmctl.lmcode.Registry;
import io.lmctl.lmcode.Value;
import java.util.List;
import org.teavm.jso.canvas.CanvasRenderingContext2D;
import org.teavm.jso.dom.html.HTMLCanvasElement;
import org.teavm.jso.dom.html.HTMLDocument;
import org.teavm.jso.dom.html.HTMLElement;

final class BrowserDom {
    private static HTMLDocument document;

    private BrowserDom() {
    }

    static void register(Registry registry, HTMLDocument document) {
        BrowserDom.document = document;
        registry.function("dom_set_text", List.of("string", "string"), "void", (context, self, args) -> {
            element(string(args[0])).setInnerText(string(args[1]));
            return Value.none();
        });
        registry.function("dom_set_html", List.of("string", "string"), "void", (context, self, args) -> {
            AnimationDemo.stop();
            element(string(args[0])).setInnerHTML(string(args[1]));
            return Value.none();
        });
        registry.function("canvas_clear", List.of("string", "int", "int"), "void", (context, self, args) -> {
            HTMLCanvasElement canvas = canvas(string(args[0]));
            int width = (int) args[1].asInt();
            int height = (int) args[2].asInt();
            canvas.setWidth(width);
            canvas.setHeight(height);
            canvasContext(canvas).clearRect(0, 0, width, height);
            return Value.none();
        });
        registry.function("canvas_fill_rect",
                List.of("string", "int", "int", "int", "int", "string"), "void", (context, self, args) -> {
                    CanvasRenderingContext2D canvas = canvasContext(canvas(string(args[0])));
                    canvas.setFillStyle(string(args[5]));
                    canvas.fillRect(args[1].asInt(), args[2].asInt(), args[3].asInt(), args[4].asInt());
                    return Value.none();
                });
        registry.function("canvas_stroke_line",
                List.of("string", "int", "int", "int", "int", "string", "int"), "void", (context, self, args) -> {
                    CanvasRenderingContext2D canvas = canvasContext(canvas(string(args[0])));
                    canvas.setStrokeStyle(string(args[5]));
                    canvas.setLineWidth(args[6].asInt());
                    canvas.beginPath();
                    canvas.moveTo(args[1].asInt(), args[2].asInt());
                    canvas.lineTo(args[3].asInt(), args[4].asInt());
                    canvas.stroke();
                    return Value.none();
                });
        registry.function("canvas_fill_text",
                List.of("string", "string", "int", "int", "string", "string"), "void", (context, self, args) -> {
                    CanvasRenderingContext2D canvas = canvasContext(canvas(string(args[0])));
                    canvas.setFillStyle(string(args[4]));
                    canvas.setFont(string(args[5]));
                    canvas.setTextAlign("center");
                    canvas.setTextBaseline("middle");
                    canvas.fillText(string(args[1]), args[2].asInt(), args[3].asInt());
                    return Value.none();
                });
        registry.function("canvas_fill_circle",
                List.of("string", "int", "int", "int", "string"), "void", (context, self, args) -> {
                    CanvasRenderingContext2D canvas = canvasContext(canvas(string(args[0])));
                    canvas.setFillStyle(string(args[4]));
                    canvas.beginPath();
                    canvas.arc(args[1].asInt(), args[2].asInt(), args[3].asInt(), 0, Math.PI * 2);
                    canvas.fill();
                    return Value.none();
                });
        registry.function("webgl_draw", List.of("string"), "void", (context, self, args) -> {
            WebGlDemo.draw(canvas(string(args[0])));
            return Value.none();
        });
        registry.function("animation_start", List.of("string"), "void", (context, self, args) -> {
            AnimationDemo.start(canvas(string(args[0])));
            return Value.none();
        });
    }

    private static HTMLElement element(String id) {
        HTMLElement element = document.getElementById(id);
        if (element == null) {
            throw new IllegalStateException("DOM element not found: " + id);
        }
        return element;
    }

    private static HTMLCanvasElement canvas(String id) {
        HTMLElement element = element(id);
        if (!(element instanceof HTMLCanvasElement)) {
            throw new IllegalStateException("DOM element is not a canvas: " + id);
        }
        return (HTMLCanvasElement) element;
    }

    private static CanvasRenderingContext2D canvasContext(HTMLCanvasElement canvas) {
        return canvas.getContext("2d").cast();
    }

    private static String string(Value value) {
        return value.asString().toString();
    }
}
