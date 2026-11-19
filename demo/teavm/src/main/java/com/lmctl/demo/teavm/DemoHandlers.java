package com.lmctl.demo.teavm;

import io.lmctl.lmcode.Context;
import io.lmctl.lmcode.Program;
import io.lmctl.lmcode.Registry;
import io.lmctl.lmcode.Value;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import org.teavm.jso.dom.html.HTMLDocument;

final class DemoHandlers {
    private final Program program;
    private final Registry registry = new Registry(false);
    private final Context context = new Context();

    DemoHandlers(HTMLDocument document) {
        BrowserDom.register(registry, document);
        program = Program.load(Base64.getDecoder().decode(DemoHandlersProgram.BYTECODE),
                DemoHandlersProgram.SCHEMA.getBytes(StandardCharsets.UTF_8), registry);
    }

    void run(String annotation) {
        program.call(findEntry(annotation), context, registry, List.of());
    }

    String render(String title, boolean completed) {
        Value result = program.call(findEntry("render"), context, registry,
                List.of(Value.ofString(title), Value.ofBool(completed)));
        return result.asString().toString();
    }

    void draw(String command, int x, int y, int width, int height, String color, String text) {
        program.call(findEntry("draw"), context, registry, List.of(
                Value.ofString(command), Value.ofInt(x), Value.ofInt(y), Value.ofInt(width), Value.ofInt(height),
                Value.ofString(color), Value.ofString(text)));
    }

    private int findEntry(String annotation) {
        for (int i = 0; i < program.entries().size(); i++) {
            if (program.entries().get(i).annotation().equals(annotation)) {
                return i;
            }
        }
        throw new IllegalStateException("LMCode entry is missing: @" + annotation);
    }
}
