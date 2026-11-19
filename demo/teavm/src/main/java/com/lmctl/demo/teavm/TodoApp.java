package com.lmctl.demo.teavm;

import org.teavm.jso.JSBody;
import org.teavm.jso.JSObject;
import org.teavm.jso.JSProperty;
import org.teavm.jso.ajax.XMLHttpRequest;
import org.teavm.jso.browser.Window;
import org.teavm.jso.core.JSArrayReader;
import org.teavm.jso.core.JSPromise;
import org.teavm.jso.core.JSUndefined;
import org.teavm.jso.dom.html.HTMLButtonElement;
import org.teavm.jso.dom.html.HTMLDocument;
import org.teavm.jso.dom.html.HTMLElement;
import org.teavm.jso.dom.html.HTMLSelectElement;
import org.teavm.jso.dom.xml.NodeList;
import org.teavm.jso.json.JSON;

public final class TodoApp {
    private static HTMLDocument document;
    private static HTMLSelectElement modeSelect;
    private static HTMLButtonElement runButton;
    private static HTMLElement status;
    private static DemoHandlers handlers;

    private TodoApp() {
    }

    public static void main(String[] args) {
        document = Window.current().getDocument();
        modeSelect = (HTMLSelectElement) document.getElementById("demo-mode");
        runButton = (HTMLButtonElement) document.getElementById("run-demo");
        status = document.getElementById("status");
        handlers = new DemoHandlers(document);
        hydrateCodeBlocks();
        modeSelect.onEvent("change", event -> activateMode());
        runButton.onClick(event -> runSelectedMode());
        activateMode();
    }

    private static void activateMode() {
        String mode = modeSelect.getValue();
        if (isDataMode(mode)) {
            runButton.setInnerText("Reload drawing");
            startDataDrawing(mode);
            return;
        }
        handlers.run(mode);
        runButton.setInnerText(switch (mode) {
            case "todo" -> "Load todos";
            case "animation" -> "Restart animation";
            case "webgl" -> "Redraw cube";
            default -> "Redraw diagram";
        });
    }

    private static void runSelectedMode() {
        String mode = modeSelect.getValue();
        if (mode.equals("todo")) {
            loadTodos();
        } else if (isDataMode(mode)) {
            startDataDrawing(mode);
        } else {
            handlers.run(mode);
        }
    }

    private static void loadTodos() {
        setLoading("Loading todos…");
        XMLHttpRequest request = XMLHttpRequest.create();
        request.open("GET", "todos.json");
        request.onComplete(() -> completeTodosRequest(request));
        request.onError(event -> showError("Could not load todos. Check your connection and try again."));
        request.send();
    }

    private static void completeTodosRequest(XMLHttpRequest request) {
        if (!successful(request)) {
            showError("Could not load todos (HTTP " + request.getStatus() + ").");
            return;
        }

        try {
            HTMLElement list = document.getElementById("todo-list");
            list.clear();
            JSArrayReader<Todo> todos = JSON.parse(request.getResponseText()).cast();
            for (int i = 0; i < todos.getLength(); i++) {
                Todo todo = todos.get(i);
                HTMLElement item = document.createElement("li");
                item.setClassName(todo.isCompleted() ? "todo completed" : "todo");

                HTMLElement label = document.createElement("span");
                label.setInnerText(handlers.render(todo.getTitle(), todo.isCompleted()));
                item.appendChild(label);
                list.appendChild(item);
            }
            status.setInnerText(todos.getLength() + " todos fetched by TeaVM and rendered by LMCode @render");
        } catch (RuntimeException e) {
            showError("The todo file contains invalid JSON.");
        } finally {
            setReady();
        }
    }

    private static void startDataDrawing(String mode) {
        handlers.run("data");
        loadDrawing(dataFile(mode));
    }

    private static void loadDrawing(String file) {
        setLoading("Loading " + file + "…");
        XMLHttpRequest request = XMLHttpRequest.create();
        request.open("GET", file);
        request.onComplete(() -> completeDrawingRequest(request, file));
        request.onError(event -> showError("Could not load " + file + ". Check your connection and try again."));
        request.send();
    }

    private static void completeDrawingRequest(XMLHttpRequest request, String file) {
        if (!successful(request)) {
            showError("Could not load " + file + " (HTTP " + request.getStatus() + ").");
            return;
        }

        try {
            Drawing drawing = JSON.parse(request.getResponseText()).cast();
            JSArrayReader<DrawCommand> commands = drawing.getCommands();
            for (int i = 0; i < commands.getLength(); i++) {
                DrawCommand command = commands.get(i);
                String type = command.getType();
                if (!type.equals("rect") && !type.equals("line") && !type.equals("circle") && !type.equals("text")) {
                    throw new IllegalArgumentException("Unknown draw command: " + type);
                }
                String color = stringOrEmpty(command.getColor());
                if (color.isEmpty()) {
                    color = "#8dd8c5";
                }
                String text = stringOrEmpty(command.getText());
                handlers.draw(type, intOrZero(command.getX()), intOrZero(command.getY()),
                        intOrZero(command.getW()), intOrZero(command.getH()), color, text);
            }
            status.setInnerText(drawing.getTitle() + ": " + commands.getLength()
                    + " commands loaded from " + file + " and rendered by LMCode @draw");
        } catch (RuntimeException e) {
            showError("The drawing file contains invalid JSON or an unsupported command: " + e.getMessage());
        } finally {
            setReady();
        }
    }

    private static boolean isDataMode(String mode) {
        return mode.equals("data-shapes") || mode.equals("data-chart");
    }

    private static String dataFile(String mode) {
        return mode.equals("data-shapes") ? "drawing-shapes.json" : "drawing-chart.json";
    }

    private static boolean successful(XMLHttpRequest request) {
        return request.getStatus() >= 200 && request.getStatus() < 300;
    }

    private static void setLoading(String message) {
        runButton.setDisabled(true);
        modeSelect.setDisabled(true);
        status.setInnerText(message);
    }

    private static void setReady() {
        runButton.setDisabled(false);
        modeSelect.setDisabled(false);
    }

    private static void showError(String message) {
        status.setInnerText(message);
        setReady();
    }

    private static void hydrateCodeBlocks() {
        NodeList<? extends HTMLElement> blocks = document.querySelectorAll("pre code");
        for (int i = 0; i < blocks.getLength(); i++) {
            HTMLElement code = blocks.get(i);
            HTMLElement container = code.getParentNode().getParentNode().cast();
            HTMLButtonElement button = (HTMLButtonElement) document.createElement("button");
            button.setAttribute("type", "button");
            button.setClassName("copy-button");
            button.setInnerText("Copy to clipboard");
            button.setAttribute("aria-label", "Copy code to clipboard");
            container.appendChild(button);
            button.onClick(event -> copyCode(button, code.getInnerText()));
        }
    }

    private static void copyCode(HTMLButtonElement button, String text) {
        if (!hasClipboard()) {
            button.setInnerText("Clipboard unavailable");
            button.setAttribute("aria-label", "Clipboard unavailable");
            return;
        }
        button.setDisabled(true);
        button.setAttribute("aria-label", "Copying code to clipboard");
        writeClipboard(text).then(result -> {
            button.setInnerText("Copied!");
            button.setAttribute("aria-label", "Code copied to clipboard");
            button.setDisabled(false);
            return JSUndefined.instance();
        }, error -> {
            button.setInnerText("Copy failed");
            button.setAttribute("aria-label", "Copy to clipboard failed");
            button.setDisabled(false);
            return JSUndefined.instance();
        });
    }

    @JSBody(params = {}, script = "return typeof navigator.clipboard !== 'undefined' && window.isSecureContext;")
    private static native boolean hasClipboard();

    @JSBody(params = { "text" }, script = "return navigator.clipboard.writeText(text);")
    private static native JSPromise<JSUndefined> writeClipboard(String text);

    @JSBody(params = { "value" }, script = "return value == null ? '' : value;")
    private static native String stringOrEmpty(String value);

    @JSBody(params = { "value" }, script = "return value == null ? 0 : value;")
    private static native int intOrZero(int value);

    private interface Todo extends JSObject {
        @JSProperty
        String getTitle();

        @JSProperty
        boolean isCompleted();
    }

    private interface Drawing extends JSObject {
        @JSProperty
        String getTitle();

        @JSProperty
        JSArrayReader<DrawCommand> getCommands();
    }

    private interface DrawCommand extends JSObject {
        @JSProperty
        String getType();

        @JSProperty
        int getX();

        @JSProperty
        int getY();

        @JSProperty
        int getW();

        @JSProperty
        int getH();

        @JSProperty
        String getColor();

        @JSProperty
        String getText();
    }
}
