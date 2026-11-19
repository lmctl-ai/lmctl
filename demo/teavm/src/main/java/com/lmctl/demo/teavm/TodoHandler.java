package com.lmctl.demo.teavm;

import io.lmctl.lmcode.Context;
import io.lmctl.lmcode.Program;
import io.lmctl.lmcode.Registry;
import io.lmctl.lmcode.Value;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

final class TodoHandler {
    private final Program program;
    private final Registry registry = new Registry(false);
    private final Context context = new Context();
    private final int renderEntry;

    TodoHandler() {
        program = Program.load(Base64.getDecoder().decode(TodoHandlerProgram.BYTECODE),
                TodoHandlerProgram.SCHEMA.getBytes(StandardCharsets.UTF_8), registry);
        renderEntry = findRenderEntry();
    }

    String render(String title, boolean completed) {
        Value result = program.call(renderEntry, context, registry,
                List.of(Value.ofString(title), Value.ofBool(completed)));
        return result.asString().toString();
    }

    private int findRenderEntry() {
        for (int i = 0; i < program.entries().size(); i++) {
            if (program.entries().get(i).annotation().equals("render")) {
                return i;
            }
        }
        throw new IllegalStateException("LMCode render entry is missing");
    }
}
