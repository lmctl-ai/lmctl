package com.lmctl.demo.teavm;

import org.teavm.jso.JSObject;
import org.teavm.jso.JSProperty;
import org.teavm.jso.ajax.XMLHttpRequest;
import org.teavm.jso.browser.Window;
import org.teavm.jso.core.JSArrayReader;
import org.teavm.jso.dom.html.HTMLButtonElement;
import org.teavm.jso.dom.html.HTMLDocument;
import org.teavm.jso.dom.html.HTMLElement;
import org.teavm.jso.json.JSON;

public final class TodoApp {
    private static HTMLDocument document;
    private static HTMLButtonElement loadButton;
    private static HTMLElement status;
    private static HTMLElement list;
    private static TodoHandler todoHandler;

    private TodoApp() {
    }

    public static void main(String[] args) {
        document = Window.current().getDocument();
        loadButton = (HTMLButtonElement) document.getElementById("load-todos");
        status = document.getElementById("status");
        list = document.getElementById("todo-list");
        todoHandler = new TodoHandler();
        loadButton.onClick(event -> loadTodos());
    }

    private static void loadTodos() {
        loadButton.setDisabled(true);
        list.clear();
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
            JSArrayReader<Todo> todos = JSON.parse(request.getResponseText()).cast();
            for (int i = 0; i < todos.getLength(); i++) {
                Todo todo = todos.get(i);
                HTMLElement item = document.createElement("li");
                item.setClassName(todo.isCompleted() ? "todo completed" : "todo");

                HTMLElement label = document.createElement("span");
                label.setInnerText(todoHandler.render(todo.getTitle(), todo.isCompleted()));
                item.appendChild(label);
                list.appendChild(item);
            }
            status.setInnerText(todos.getLength() + " todos rendered by LMCode TodoHandler");
        } catch (RuntimeException e) {
            showError("The todo file contains invalid JSON.");
        } finally {
            loadButton.setDisabled(false);
        }
    }

    private static void showError(String message) {
        status.setInnerText(message);
        loadButton.setDisabled(false);
    }

    private interface Todo extends JSObject {
        @JSProperty
        String getTitle();

        @JSProperty
        boolean isCompleted();
    }
}
