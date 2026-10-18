interface FaqItem {
    q: string;
    a: string;
}
export declare function buildFaqJsonl(items: FaqItem[]): string;
export declare function buildSchemamapXml(today: string): string;
export declare function generateFaqFeed(publicDir: string): void;
export {};
