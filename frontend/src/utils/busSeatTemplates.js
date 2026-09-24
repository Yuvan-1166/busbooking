// A template's seat class is derived from its type name, e.g. a
// SEATER_2_PLUS_2 template is a "SEATER" arrangement while a
// DOUBLE_DECKER_SLEEPER_2_PLUS_1 template is a "SLEEPER" arrangement.
const SEAT_CLASSES_BY_BUS_TYPE = {
  SEATER: ["SEATER"],
  SEMI_SLEEPER: ["SEMI_SLEEPER"],
  SLEEPER: ["SLEEPER", "SLEEPER_CUM_SEATER"],
};

export function templateSeatClass(templateType) {
  if (!templateType) return null;
  const type = String(templateType);
  if (type.includes("SLEEPER_CUM_SEATER")) return "SLEEPER_CUM_SEATER";
  if (type.includes("SEMI_SLEEPER")) return "SEMI_SLEEPER";
  if (type.includes("SLEEPER")) return "SLEEPER";
  if (type.includes("SEATER")) return "SEATER";
  return null;
}

export function templatesForBus(templates, bus) {
  const allowedClasses = SEAT_CLASSES_BY_BUS_TYPE[bus?.busType] || null;
  if (!allowedClasses || !bus?.deckType) return [];
  return templates.filter(
    (template) =>
      template.deckType === bus.deckType &&
      allowedClasses.includes(templateSeatClass(template.templateType)),
  );
}