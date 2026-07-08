"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Lang = "es" | "en";

const translations = {
  es: {
    "app.title": "Fulse",
    "app.description": "Tu cocina con IA — recetas, listas y planificación",

    "nav.create": "Crear",
    "nav.recipes": "Mis recetas",
    "nav.pantry": "Mi nevera",
    "nav.settings": "Ajustes",
    "nav.coming_soon": "Próximamente",

    "create.title": "¿Qué quieres cocinar hoy?",
    "create.subtitle": "Describe lo que se te antoje y la IA te dará una receta completa.",
    "create.placeholder": "\"Una pasta cremosa con champiñones\", \"Algo con lo que tenga en la nevera\"...",
    "create.chip_quick_chicken": "Algo rápido con pollo",
    "create.chip_pasta": "Pasta cremosa",
    "create.chip_salad": "Ensalada fresca",
    "create.chip_breakfast": "Desayuno saludable",
    "create.chip_soup": "Sopa reconfortante",
    "create.chip_dessert": "Postre sin horno",
    "create.generate": "Generar receta",
    "create.generating": "Generando receta...",
    "create.adjust_placeholder": "Ajústala: ej. sin horno, más picante...",
    "create.recent": "Recientes",
    "create.saved": "¡Receta guardada!",
    "create.error": "Error al generar la receta",
    "create.edit_save": "Guardar cambios",

    "card.save": "Guardar en...",
    "card.saving": "Guardando...",
    "card.edit": "Editar",
    "card.ingredients": "Ingredientes",
    "card.preparation": "Preparación",
    "card.minutes": "min",
    "card.portions": "porciones",
    "card.portion": "porción",

    "sheet.title": "Guardar en...",
    "sheet.new_list": "Nueva lista...",
    "sheet.no_list": "Sin lista",
    "sheet.save": "Guardar",

    "draft.view": "Ver",
    "draft.save": "Guardar",
    "draft.discard": "Descartar",
    "draft.untitled": "Sin título",

    "recipes.title": "Mis recetas",
    "recipes.search": "Buscar por título...",
    "recipes.all": "Todas",
    "recipes.new": "Nueva",
    "recipes.new_prompt": "Nombre de la nueva lista:",
    "recipes.empty_no_filters": "Aún no tienes recetas guardadas.",
    "recipes.empty_with_filters": "No se encontraron recetas con esos filtros.",
    "recipes.create_first": "Crear mi primera receta",
    "recipes.time_15": "≤ 15 min",
    "recipes.time_30": "≤ 30 min",
    "recipes.time_60": "≤ 60 min",

    "detail.portions": "porciones",
    "detail.portion": "porción",
    "detail.ingredients": "Ingredientes",
    "detail.preparation": "Preparación",
    "detail.save": "Guardar en...",
    "detail.delete_confirm": "¿Eliminar esta receta?",
    "detail.not_found": "Receta no encontrada",

    "settings.title": "Ajustes",
    "settings.profile": "Perfil de gustos",
    "settings.allergies": "Alergias",
    "settings.allergies_placeholder": "maní, mariscos...",
    "settings.restrictions": "Restricciones",
    "settings.restrictions_placeholder": "sin gluten, baja en azúcar...",
    "settings.disliked": "Ingredientes que no te gustan",
    "settings.disliked_placeholder": "cilantro...",
    "settings.loved": "Ingredientes que te encantan",
    "settings.loved_placeholder": "ajo, limón...",
    "settings.equipment": "Equipo de cocina",
    "settings.equipment_placeholder": "airfryer, horno...",
    "settings.servings": "Porciones por defecto",
    "settings.save_profile": "Guardar perfil",
    "settings.saved": "Guardado",
    "settings.lists": "Mis listas",
    "settings.recipes_count": "recetas",
    "settings.list_delete_confirm": "¿Eliminar esta lista? Las recetas no se borrarán.",
    "settings.usage": "Uso",
    "settings.generations_month": "generaciones este mes",
    "settings.language": "Idioma",
    "settings.lang_es": "Español",
    "settings.lang_en": "English",
    "settings.objectives_title": "Mi objetivo",
    "settings.objectives_disclaimer": "Fulse te orienta con sugerencias generales. No es una herramienta médica. Si tienes una condición de salud, consulta a un profesional.",
    "settings.objectives_on": "Objetivos activos",
    "settings.objectives_off": "Sin objetivo — modo antojo",
    "settings.body_title": "Datos opcionales",
    "settings.body_subtitle": "Estos datos son opcionales. Si los compartes, las sugerencias se ajustan mejor. Sin ellos, tu objetivo funciona igual con valores generales.",
    "settings.body_consent": "Acepto que Fulse guarde estos datos (edad, peso, estatura, actividad) únicamente para personalizar mis sugerencias. Los datos se almacenan en mi base de datos, no se comparten con terceros ni se envían a los proveedores de IA, y puedo borrarlos en cualquier momento.",
    "settings.body_age": "Edad",
    "settings.body_weight": "Peso (kg)",
    "settings.body_height": "Estatura (cm)",
    "settings.body_activity": "Actividad",
    "settings.body_sex_m": "Hombre",
    "settings.body_sex_f": "Mujer",
    "settings.body_sex_null": "Prefiero no decir",
    "settings.body_activity_sedentario": "Sedentario",
    "settings.body_activity_ligero": "Ligero",
    "settings.body_activity_moderado": "Moderado",
    "settings.body_activity_activo": "Activo",
    "settings.body_activity_muy_activo": "Muy activo",
    "settings.body_activity_hint_sedentario": "poco o nada de ejercicio",
    "settings.body_activity_hint_ligero": "1-3 días por semana",
    "settings.body_activity_hint_moderado": "3-5 días por semana",
    "settings.body_activity_hint_activo": "6-7 días por semana",
    "settings.body_activity_hint_muy_activo": "ejercicio intenso diario",
    "settings.delete_data": "Borrar mis datos personales",
    "settings.delete_confirm": "¿Borrar todos tus datos personales? Tus objetivos se conservan.",
    "settings.logout": "Cerrar sesión",

    "memory.title": "Mi Memoria",
    "memory.description": "Fulse aprende en silencio de lo que cocinás y guardás. Acá podés verlo y editarlo.",
    "memory.learning_toggle": "Aprendizaje automático",
    "memory.ingredients_section": "Ingredientes",
    "memory.tags_section": "Estilos y preferencias",
    "memory.recent_activity": "Actividad reciente",
    "memory.delete_all": "Borrar toda la memoria",
    "memory.delete_all_confirm": "¿Borrar toda la memoria de Fulse? Esto elimina todo lo que aprendió de tus hábitos.",
    "memory.add_ingredient": "Agregar ingrediente",
    "memory.no_data": "Fulse todavía no aprendió nada. ¡Empezá a guardar y cocinar recetas!",
    "recipe.cooked_this": "Cociné esto",
    "recipe.cook_button": "Cociné esto",

    "pantry.title": "Mi nevera",
    "pantry.subtitle": "Toma una foto de tus ingredientes y la IA te dirá qué puedes cocinar.",
    "pantry.upload_hint": "Tomar foto o seleccionar imagen",
    "pantry.detecting": "Detectando...",
    "pantry.detect": "Detectar ingredientes",
    "pantry.detected": "Ingredientes detectados:",

    "import.tab_generate": "Generar",
    "import.tab_import": "Añadir",
    "import.placeholder": "Pega aquí la receta (de ChatGPT, un blog, WhatsApp...)",
    "import.parse": "Reconocer receta",
    "import.parsing": "Leyendo tu receta...",
    "import.not_recipe": "No encontré una receta en ese texto.",
    "import.confidence_low": "Revisa bien antes de guardar — algunos datos pueden faltar.",
    "import.badge": "Añadida",
    "import.scan_photo": "Escanear foto de receta",
    "import.scanning_photo": "Escaneando foto...",
    "import.ocr_hint": "Toma una foto de una receta impresa y la IA la reconocerá.",
    "import.edit": "Editar",

    "nutrition.view": "Ver detalle nutricional",
    "nutrition.calories": "Calorías",
    "nutrition.protein": "Proteína",
    "nutrition.carbs": "Carbohidratos",
    "nutrition.fat": "Grasas",
    "nutrition.disclaimer": "Estimación generada por IA — valores aproximados. Esto no reemplaza el consejo de un médico o nutricionista.",

    "goals.bajar_peso": "Bajar de peso",
    "goals.ganar_musculo": "Ganar masa muscular",
    "goals.mas_saludable": "Comer más saludable",
    "goals.mantenerme": "Mantenerme",
    "goals.mas_proteina": "Más proteína",
    "goals.menos_azucar": "Menos azúcar",
    "goals.menos_sal": "Menos sal",
    "goals.mas_vegetales": "Más vegetales",
    "goals.economico": "Comer económico",

    "ai.system_prompt": "Eres un chef experto. Genera UNA receta basada en la conversación con el usuario.\nSi el usuario pide ajustes a una receta anterior, devuelve la receta COMPLETA corregida.\n\nPerfil del usuario (respétalo SIEMPRE, sin que lo repita):\n- Alergias: {allergies} — NUNCA incluir estos ingredientes\n- Restricciones: {restrictions}\n- No le gusta: {dislikedIngredients} — evitarlos\n- Le encanta: {lovedIngredients} — favorecerlos cuando tenga sentido\n- Equipo disponible: {equipment} — solo proponer técnicas posibles con este equipo\n- Porciones por defecto si no especifica: {defaultServings}\n\nResponde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta, sin texto adicional:\n{{\n  \"title\": \"string\",\n  \"description\": \"string breve y apetitosa (1-2 frases)\",\n  \"prepTimeMinutes\": number,\n  \"cookTimeMinutes\": number,\n  \"servings\": number,\n  \"tags\": [\"string\"],\n  \"ingredients\": [\n    {{\n      \"name\": \"string en minúsculas y singular\",\n      \"quantity\": number | null,\n      \"unit\": \"string o null\",\n      \"quantityText\": \"string o null\",\n      \"note\": \"string o null\"\n    }}\n  ],\n  \"steps\": [\"string\"]\n}}\nUsa ingredientes comunes y unidades métricas o caseras.",
  },

  en: {
    "app.title": "Fulse",
    "app.description": "Your AI kitchen — recipes, lists, and meal planning",

    "nav.create": "Create",
    "nav.recipes": "My Recipes",
    "nav.pantry": "My Pantry",
    "nav.settings": "Settings",
    "nav.coming_soon": "Coming Soon",

    "create.title": "What do you want to cook today?",
    "create.subtitle": "Describe what you're craving and AI will give you a complete recipe.",
    "create.placeholder": "\"A creamy mushroom pasta\", \"Something with what I have in the fridge\"...",
    "create.chip_quick_chicken": "Quick chicken dish",
    "create.chip_pasta": "Creamy pasta",
    "create.chip_salad": "Fresh salad",
    "create.chip_breakfast": "Healthy breakfast",
    "create.chip_soup": "Comforting soup",
    "create.chip_dessert": "No-bake dessert",
    "create.generate": "Generate Recipe",
    "create.generating": "Generating recipe...",
    "create.adjust_placeholder": "Adjust it: e.g. no oven, spicier...",
    "create.recent": "Recent",
    "create.saved": "Recipe saved!",
    "create.error": "Error generating recipe",
    "create.edit_save": "Save changes",

    "card.save": "Save to...",
    "card.saving": "Saving...",
    "card.edit": "Edit",
    "card.ingredients": "Ingredients",
    "card.preparation": "Preparation",
    "card.minutes": "min",
    "card.portions": "servings",
    "card.portion": "serving",

    "sheet.title": "Save to...",
    "sheet.new_list": "New list...",
    "sheet.no_list": "No list",
    "sheet.save": "Save",

    "draft.view": "View",
    "draft.save": "Save",
    "draft.discard": "Discard",
    "draft.untitled": "Untitled",

    "recipes.title": "My Recipes",
    "recipes.search": "Search by title...",
    "recipes.all": "All",
    "recipes.new": "New",
    "recipes.new_prompt": "New list name:",
    "recipes.empty_no_filters": "You haven't saved any recipes yet.",
    "recipes.empty_with_filters": "No recipes found with those filters.",
    "recipes.create_first": "Create my first recipe",
    "recipes.time_15": "≤ 15 min",
    "recipes.time_30": "≤ 30 min",
    "recipes.time_60": "≤ 60 min",

    "detail.portions": "servings",
    "detail.portion": "serving",
    "detail.ingredients": "Ingredients",
    "detail.preparation": "Preparation",
    "detail.save": "Save to...",
    "detail.delete_confirm": "Delete this recipe?",
    "detail.not_found": "Recipe not found",

    "settings.title": "Settings",
    "settings.profile": "Taste Profile",
    "settings.allergies": "Allergies",
    "settings.allergies_placeholder": "peanuts, shellfish...",
    "settings.restrictions": "Restrictions",
    "settings.restrictions_placeholder": "gluten-free, low sugar...",
    "settings.disliked": "Ingredients you dislike",
    "settings.disliked_placeholder": "cilantro...",
    "settings.loved": "Ingredients you love",
    "settings.loved_placeholder": "garlic, lemon...",
    "settings.equipment": "Kitchen equipment",
    "settings.equipment_placeholder": "airfryer, oven...",
    "settings.servings": "Default servings",
    "settings.save_profile": "Save profile",
    "settings.saved": "Saved",
    "settings.lists": "My lists",
    "settings.recipes_count": "recipes",
    "settings.list_delete_confirm": "Delete this list? Recipes will not be deleted.",
    "settings.usage": "Usage",
    "settings.generations_month": "generations this month",
    "settings.language": "Language",
    "settings.lang_es": "Español",
    "settings.lang_en": "English",
    "settings.objectives_title": "My Goal",
    "settings.objectives_disclaimer": "Fulse provides general guidance. This is not a medical tool. If you have a health condition, consult a professional.",
    "settings.objectives_on": "Goals active",
    "settings.objectives_off": "No goal — treat mode",
    "settings.body_title": "Optional data",
    "settings.body_subtitle": "This data is optional. If you share it, suggestions will be more accurate. Your goal works without it using general values.",
    "settings.body_consent": "I agree that Fulse stores this data (age, weight, height, activity) solely to personalize my recipe suggestions. The data is stored in my database, is not shared with third parties or sent to AI providers, and I can delete it anytime.",
    "settings.body_age": "Age",
    "settings.body_weight": "Weight (kg)",
    "settings.body_height": "Height (cm)",
    "settings.body_activity": "Activity",
    "settings.body_sex_m": "Male",
    "settings.body_sex_f": "Female",
    "settings.body_sex_null": "Prefer not to say",
    "settings.body_activity_sedentario": "Sedentary",
    "settings.body_activity_ligero": "Light",
    "settings.body_activity_moderado": "Moderate",
    "settings.body_activity_activo": "Active",
    "settings.body_activity_muy_activo": "Very active",
    "settings.body_activity_hint_sedentario": "little to no exercise",
    "settings.body_activity_hint_ligero": "1-3 days per week",
    "settings.body_activity_hint_moderado": "3-5 days per week",
    "settings.body_activity_hint_activo": "6-7 days per week",
    "settings.body_activity_hint_muy_activo": "intense daily exercise",
    "settings.delete_data": "Delete my personal data",
    "settings.delete_confirm": "Delete all your personal data? Your goals will be kept.",
    "settings.logout": "Log out",

    "memory.title": "My Memory",
    "memory.description": "Fulse silently learns from what you cook and save. Here you can see and edit it.",
    "memory.learning_toggle": "Automatic learning",
    "memory.ingredients_section": "Ingredients",
    "memory.tags_section": "Styles & preferences",
    "memory.recent_activity": "Recent activity",
    "memory.delete_all": "Clear all memory",
    "memory.delete_all_confirm": "Delete all of Fulse's memory? This removes everything it learned from your habits.",
    "memory.add_ingredient": "Add ingredient",
    "memory.no_data": "Fulse hasn't learned anything yet. Start saving and cooking recipes!",
    "recipe.cooked_this": "Cooked this",
    "recipe.cook_button": "Cooked this",

    "pantry.title": "My Pantry",
    "pantry.subtitle": "Take a photo of your ingredients and AI will tell you what you can cook.",
    "pantry.upload_hint": "Take photo or select image",
    "pantry.detecting": "Detecting...",
    "pantry.detect": "Detect ingredients",
    "pantry.detected": "Detected ingredients:",

    "import.tab_generate": "Generate",
    "import.tab_import": "Add",
    "import.placeholder": "Paste the recipe here (from ChatGPT, a blog, WhatsApp...)",
    "import.parse": "Recognize recipe",
    "import.parsing": "Reading your recipe...",
    "import.not_recipe": "I couldn't find a recipe in that text.",
    "import.confidence_low": "Double check before saving — some data may be missing.",
    "import.badge": "Added",
    "import.scan_photo": "Scan recipe photo",
    "import.scanning_photo": "Scanning photo...",
    "import.ocr_hint": "Take a photo of a printed recipe and AI will recognize it.",
    "import.edit": "Edit",

    "nutrition.view": "View nutrition details",
    "nutrition.calories": "Calories",
    "nutrition.protein": "Protein",
    "nutrition.carbs": "Carbs",
    "nutrition.fat": "Fat",
    "nutrition.disclaimer": "AI-generated estimate — approximate values. This does not replace medical or nutrition professional advice.",

    "goals.bajar_peso": "Lose weight",
    "goals.ganar_musculo": "Gain muscle",
    "goals.mas_saludable": "Eat healthier",
    "goals.mantenerme": "Maintain weight",
    "goals.mas_proteina": "More protein",
    "goals.menos_azucar": "Less sugar",
    "goals.menos_sal": "Less salt",
    "goals.mas_vegetales": "More vegetables",
    "goals.economico": "Budget-friendly",

    "ai.system_prompt": `You are an expert chef. Generate ONE recipe based on the conversation with the user.
If the user asks for adjustments to a previous recipe, return the COMPLETE corrected recipe.

User profile (ALWAYS respect it, without the user having to repeat it):
- Allergies: {allergies} — NEVER include these ingredients
- Restrictions: {restrictions}
- Dislikes: {dislikedIngredients} — avoid them
- Loves: {lovedIngredients} — favor when it makes sense
- Available equipment: {equipment} — only suggest techniques possible with this equipment
- Default servings if not specified: {defaultServings}

Respond ONLY with a valid JSON object with this exact structure, no additional text:
{{
  "title": "string",
  "description": "short and appetizing description (1-2 sentences)",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "tags": ["string"],
  "ingredients": [
    {{
      "name": "string in lowercase and singular",
      "quantity": number | null,
      "unit": "string or null",
      "quantityText": "string or null",
      "note": "string or null"
    }}
  ],
  "steps": ["string"]
}}
Use common ingredients and metric or home cooking units.`,
  },
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "es",
  setLang: () => {},
  t: (key) => key,
});

function translate(lang: Lang, key: string): string {
  const dict = translations[lang] as Record<string, string>;
  const esDict = translations["es"] as Record<string, string>;
  return dict[key] ?? esDict[key] ?? key;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  const handleSetLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("recepia-lang", l);
  };

  const t = (key: string): string => translate(lang, key);

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
