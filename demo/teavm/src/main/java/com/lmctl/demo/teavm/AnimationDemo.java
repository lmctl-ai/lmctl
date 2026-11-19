package com.lmctl.demo.teavm;

import org.teavm.jso.browser.Window;
import org.teavm.jso.canvas.CanvasRenderingContext2D;
import org.teavm.jso.dom.events.MouseEvent;
import org.teavm.jso.dom.html.HTMLButtonElement;
import org.teavm.jso.dom.html.HTMLCanvasElement;
import org.teavm.jso.dom.html.HTMLElement;

final class AnimationDemo {
    private static HTMLCanvasElement canvas;
    private static CanvasRenderingContext2D context;
    private static int frame;
    private static boolean running;
    private static boolean paused;
    private static boolean pointerActive;
    private static double pointerX;
    private static double pointerY;

    private AnimationDemo() {
    }

    static void start(HTMLCanvasElement target) {
        stop();
        canvas = target;
        context = canvas.getContext("2d").cast();
        running = true;
        paused = false;
        pointerActive = false;
        canvas.onEvent("pointermove", event -> {
            MouseEvent mouse = (MouseEvent) event;
            pointerX = (double) mouse.getOffsetX() * canvas.getWidth() / canvas.getClientWidth();
            pointerY = (double) mouse.getOffsetY() * canvas.getHeight() / canvas.getClientHeight();
            pointerActive = true;
        });
        canvas.onEvent("pointerleave", event -> pointerActive = false);
        HTMLButtonElement toggle = (HTMLButtonElement) canvas.getOwnerDocument().getElementById("animation-toggle");
        toggle.onClick(event -> togglePaused());
        frame = Window.requestAnimationFrame(AnimationDemo::animate);
    }

    static void stop() {
        if (running) {
            running = false;
            Window.cancelAnimationFrame(frame);
        }
        canvas = null;
        context = null;
    }

    private static void animate(double timestamp) {
        if (!running) {
            return;
        }
        if (!paused) {
            draw(timestamp / 1000);
        }
        frame = Window.requestAnimationFrame(AnimationDemo::animate);
    }

    private static void draw(double time) {
        int width = canvas.getWidth();
        int height = canvas.getHeight();
        context.setFillStyle("#0b1020");
        context.fillRect(0, 0, width, height);
        context.setStrokeStyle("#263d75");
        context.setLineWidth(1);
        for (int x = 40; x < width; x += 40) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, height);
            context.stroke();
        }
        for (int y = 40; y < height; y += 40) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(width, y);
            context.stroke();
        }

        double centerX = pointerActive ? pointerX : width / 2 + Math.cos(time * 1.4) * 170;
        double centerY = pointerActive ? pointerY : height / 2 + Math.sin(time * 1.9) * 75;
        context.setStrokeStyle("#8dd8c5");
        context.setLineWidth(3);
        context.beginPath();
        context.moveTo(width / 2, height / 2);
        context.lineTo(centerX, centerY);
        context.stroke();
        for (int i = 0; i < 8; i++) {
            double angle = time * 1.8 + i * Math.PI / 4;
            double x = centerX + Math.cos(angle) * 42;
            double y = centerY + Math.sin(angle) * 42;
            context.setFillStyle(i % 2 == 0 ? "#8dd8c5" : "#6f91e8");
            context.beginPath();
            context.arc(x, y, 6, 0, Math.PI * 2);
            context.fill();
        }
        context.setFillStyle("#edf2ff");
        context.beginPath();
        context.arc(centerX, centerY, 18, 0, Math.PI * 2);
        context.fill();
        context.setFillStyle("#b6c2df");
        context.setFont("16px sans-serif");
        context.setTextAlign("left");
        context.setTextBaseline("top");
        context.fillText(pointerActive ? "Pointer position drives the animation" : "Move the pointer over the canvas", 18, 16);
    }

    private static void togglePaused() {
        paused = !paused;
        HTMLElement status = canvas.getOwnerDocument().getElementById("status");
        HTMLButtonElement toggle = (HTMLButtonElement) canvas.getOwnerDocument().getElementById("animation-toggle");
        toggle.setInnerText(paused ? "Resume animation" : "Pause animation");
        status.setInnerText(paused ? "Animation paused. Activate Resume animation to continue."
                : "Animation resumed via requestAnimationFrame. Move the pointer; use Pause animation to stop.");
        canvas.setAttribute("aria-label", paused ? "Animation paused" : "Interactive animation running");
    }
}
