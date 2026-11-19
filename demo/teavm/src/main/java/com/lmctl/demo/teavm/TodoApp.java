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
        handlers.run(modeSelect.getValue());
        runButton.setInnerText(modeSelect.getValue().equals("todo") ? "Load todos" : "Redraw diagram");
    }

    private static void runSelectedMode() {
        if (modeSelect.getValue().equals("todo")) {
            loadTodos();
        } else {
            handlers.run(modeSelect.getValue());
        }
    }

    private static void loadTodos() {
        runButton.setDisabled(true);
        modeSelect.setDisabled(true);
        status.setInnerText("Loading todos…");

        XMLHttpRequest request = XMLHttpRequest.create();
        request.open("GET", "todos.json");
        request.onComplete(() -> completeRequest(request));
        request.onError(event -> showError("Could not load todos. Check your connection and try again."));
        request.send();
    }

    private static void completeRequest(XMLHttpRequest request) {
        if (request.getStatus() < 200 || request.getStatus() >= 300) {
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
            runButton.setDisabled(false);
            modeSelect.setDisabled(false);
        }
    }

    private static void showError(String message) {
        status.setInnerText(message);
        runButton.setDisabled(false);
        modeSelect.setDisabled(false);
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

    private interface Todo extends JSObject {
        @JSProperty
        String getTitle();

        @JSProperty
        boolean isCompleted();
    }
}
