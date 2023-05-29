import { Liquid } from 'liquidjs';
import path from 'path';

export default class TemplateLoader {
  static loadTemplate(prompt: string, context: object, template: string): Promise<string>;
  static loadTemplateFromUrl(templateUrl: string): Promise<string>;
  static loadTemplateFromPath(templatePath: string): Promise<string>;
}