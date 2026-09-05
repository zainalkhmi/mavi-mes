import { COMPONENT_REGISTRY } from './componentRegistry';

/**
 * Registry Query Service for AI Coding Agents and Discovery UI
 */
export const registryService = {
  getAll() {
    return COMPONENT_REGISTRY;
  },

  getByName(name) {
    if (!name) return null;
    return COMPONENT_REGISTRY.find((c) => c.name.toLowerCase() === name.toLowerCase()) || null;
  },

  getByCategory(category) {
    if (!category) return COMPONENT_REGISTRY;
    return COMPONENT_REGISTRY.filter((c) => c.category.toLowerCase() === category.toLowerCase());
  },

  search(query) {
    if (!query) return COMPONENT_REGISTRY;
    const q = query.toLowerCase();
    return COMPONENT_REGISTRY.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.subComponents && c.subComponents.some((s) => s.toLowerCase().includes(q)))
    );
  },

  /**
   * Generates a concise system prompt context describing all available UI components
   * to be injected into AI LLM prompts.
   */
  getAIComponentCatalogPrompt() {
    const catalog = COMPONENT_REGISTRY.map((c) => {
      const subs = c.subComponents && c.subComponents.length > 0 ? ` (Subcomponents: ${c.subComponents.join(', ')})` : '';
      return `- <${c.name}>${subs}: ${c.description} Example: ${c.example.split('\n')[0]}`;
    }).join('\n');

    return `### MaviCore Gluestack UI Component Engine Catalog\n${catalog}\n`;
  }
};
