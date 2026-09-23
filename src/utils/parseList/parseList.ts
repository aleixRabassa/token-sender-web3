// Single tokenizer for recipients and amounts: splits on newlines, commas and any whitespace.
export function parseList(input: string): string[] {
    return input
        .split(/[\n,\s]+/)
        .map(item => item.trim())
        .filter(item => item !== "")
}
