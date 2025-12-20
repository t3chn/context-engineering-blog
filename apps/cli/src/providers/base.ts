export interface AIProviderInterface {
  generate(prompt: string): Promise<string>;
}

export abstract class BaseProvider implements AIProviderInterface {
  protected apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  abstract generate(prompt: string): Promise<string>;
}
