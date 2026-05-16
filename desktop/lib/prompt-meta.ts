type PromptContext = {
  phase?: string;
  recentText?: string;
};

export function extractPromptMeta(
  kind: string,
  text: string,
  context: PromptContext = {},
): { title: string; subtitle: string } {
  if (kind === "picker") {
    if (/space choose/i.test(text)) {
      return { title: "Choose one match", subtitle: "Single selection" };
    }
    return { title: "Select content to download", subtitle: "Choose depots" };
  }

  if (kind === "yes-no") {
    const lines = text.split("\n").flatMap((line) => {
      const trimmed = line.trim();
      return trimmed ? [trimmed] : [];
    });
    const questionLine = lines.find((line) =>
      /\[(y\/n|Y\/n|y\/N)\]/i.test(line),
    );

    if (questionLine) {
      const clean = questionLine
        .replace(/\s*\[(y\/n|Y\/n|y\/N)\]\s*:?\s*$/i, "")
        .trim();

      if (/install now/i.test(clean)) {
        const installTarget = detectInstallTarget(text, context);
        return {
          title: installTarget ? `Install ${installTarget}?` : "Install now?",
          subtitle: context.phase ?? "Confirmation required",
        };
      }
      if (/online fix|crack|patch/i.test(clean)) {
        return {
          title: "Apply online fix / patch?",
          subtitle: "Confirmation required",
        };
      }
      if (/continue/i.test(clean)) {
        return {
          title: "Continue installation?",
          subtitle: "Confirmation required",
        };
      }
      if (/update/i.test(clean)) {
        return { title: "Apply update?", subtitle: "Confirmation required" };
      }
      if (/download/i.test(clean)) {
        return { title: "Start download?", subtitle: "Confirmation required" };
      }
      if (clean.length > 0 && clean.length < 80) {
        return { title: clean, subtitle: "Confirmation required" };
      }
    }
    return { title: "Confirm to continue", subtitle: "Confirmation required" };
  }

  const lines = text.split("\n").flatMap((line) => {
    const trimmed = line.trim();
    return trimmed ? [trimmed] : [];
  });
  const lastLine = lines.at(-1) ?? "";
  const clean = lastLine.replace(/:?\s*$/, "").trim();
  return {
    title: clean.length > 0 && clean.length < 80 ? clean : "Enter a value",
    subtitle: "Input required",
  };
}

function detectInstallTarget(text: string, context: PromptContext) {
  const source = [text, context.phase, context.recentText]
    .filter(Boolean)
    .join("\n");

  if (/online-fix|multiplayer fix/i.test(source)) {
    return "Online-Fix multiplayer fix";
  }

  const archiveMatch = source.match(/([\w ._-]+\.(?:zip|rar|7z|exe|msi))/i);
  return archiveMatch?.[1]?.trim();
}
