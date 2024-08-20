/**
 * ANSITextColorizer class
 * Converts ANSI color codes in text to HTML spans with inline styles.
 */
export class ANSITextColorizer {
    // Current color and style states
    private NewForegroundColor: string = "";
    private NewBackgroundColor: string = "";
    private NewIsBold: boolean = false;

    // Previous color and style states for comparison
    private CurrentForegroundColor: string = "";
    private CurrentBackgroundColor: string = "";
    private CurrentIsBold: boolean = false;

    // Flag to track if we're currently within a styled span
    private InStyle: boolean = false;
    
    // VGA color palette mapping ANSI color codes to RGB values
    private readonly PALETTE_VGA: {[key: number]: string} = {
        30: "rgb(0, 0, 0)",       // Black
        31: "rgb(170, 0, 0)",     // Red
        32: "rgb(0, 170, 0)",     // Green
        33: "rgb(170, 85, 0)",    // Yellow
        34: "rgb(0, 0, 170)",     // Blue
        35: "rgb(170, 0, 170)",   // Magenta
        36: "rgb(0, 170, 170)",   // Cyan
        37: "rgb(170, 170, 170)", // White
        90: "rgb(85, 85, 85)",    // Bright Black
        91: "rgb(255, 85, 85)",   // Bright Red
        92: "rgb(85, 255, 85)",   // Bright Green
        93: "rgb(255, 255, 85)",  // Bright Yellow
        94: "rgb(85, 85, 255)",   // Bright Blue
        95: "rgb(255, 85, 255)",  // Bright Magenta
        96: "rgb(85, 255, 255)",  // Bright Cyan
        97: "rgb(255, 255, 255)"  // Bright White
    };

    /**
     * Parses ANSI color codes from the input text.
     * @param text The input text containing ANSI codes
     * @param startIndex The index to start parsing from
     * @returns A tuple of [newIndex, colorCode, isBold]
     */
    private ParseColorCode(text: string, startIndex: number): [number, number | string, boolean] {
        // Check for standard ANSI color codes
        const standardMatch = text.substring(startIndex).match(/^\[(?:1;)?(\d+)m/);
        if (standardMatch) {
            const isBold = standardMatch[0].includes('1;');
            return [startIndex + standardMatch[0].length, parseInt(standardMatch[1]), isBold];
        }

        // Check for RGB color codes
        const rgbMatch = text.substring(startIndex).match(/^\[(\d+);2;(\d+);(\d+);(\d+)m/);
        if (rgbMatch) {
            const [_, base, r, g, b] = rgbMatch.map(Number);
            return [startIndex + rgbMatch[0].length, `rgb(${r},${g},${b})`, false];
        }

        // Return default values if no match is found
        return [startIndex, -1, false];
    }

    /**
     * Sets the current color and bold state based on the parsed color code.
     * @param colorCode The color code (either a number for ANSI or a string for RGB)
     * @param isBold Whether the text should be bold
     */
    private SetColor(colorCode: number | string, isBold: boolean): void {
        this.NewIsBold = isBold;

        if (typeof colorCode === 'string') {
            // Handle RGB color
            if (colorCode.startsWith('rgb')) {
                this.NewForegroundColor = colorCode;
            }
        } else if (typeof colorCode === 'number') {
            // Handle standard ANSI colors
            if (colorCode >= 30 && colorCode <= 37) {
                this.NewForegroundColor = this.PALETTE_VGA[isBold ? colorCode + 60 : colorCode];
            } else if (colorCode >= 90 && colorCode <= 97) {
                this.NewForegroundColor = this.PALETTE_VGA[colorCode];
            } else if (colorCode >= 40 && colorCode <= 47) {
                this.NewBackgroundColor = this.PALETTE_VGA[colorCode + 50];
            } else if (colorCode >= 100 && colorCode <= 107) {
                this.NewBackgroundColor = this.PALETTE_VGA[colorCode - 10];
            } else if (colorCode === 0) {
                // Reset all styles
                this.NewForegroundColor = "";
                this.NewBackgroundColor = "";
                this.NewIsBold = false;
            }
        }
    }

    /**
     * Appends new text to the existing text, adding style spans as necessary.
     * @param oldText The existing styled text
     * @param newText The new text to append
     * @returns The combined text with appropriate styling
     */
    private AppendText(oldText: string, newText: string): string {
        if (newText === "") return oldText;

        let spanCode: string = "";

        // Check if we need to change the current style
        if (this.NewBackgroundColor !== this.CurrentBackgroundColor || 
            this.NewForegroundColor !== this.CurrentForegroundColor ||
            this.NewIsBold !== this.CurrentIsBold) {
            
            // Close the previous style if there was one
            if (this.InStyle) {
                spanCode = "</span>";
            }

            // Open a new style span if needed
            if (this.NewBackgroundColor !== "" || this.NewForegroundColor !== "" || this.NewIsBold) {
                spanCode += "<span style='";
                if (this.NewBackgroundColor !== "") {
                    spanCode += `background-color: ${this.NewBackgroundColor};`;
                }
                if (this.NewForegroundColor !== "") {
                    spanCode += `color: ${this.NewForegroundColor};`;
                }
                if (this.NewIsBold) {
                    spanCode += `font-weight: bold;`;
                }
                spanCode += "'>";
                this.InStyle = true;
            } else {
                this.InStyle = false;
            }

            // Update the current style
            this.CurrentBackgroundColor = this.NewBackgroundColor;
            this.CurrentForegroundColor = this.NewForegroundColor;
            this.CurrentIsBold = this.NewIsBold;
        }

        return oldText + spanCode + newText;
    }

    /**
     * Converts text with ANSI color codes to HTML with inline styles.
     * @param text The input text with ANSI color codes
     * @returns The HTML string with color and style information
     */
    public ColorText(text: string): string {
        let newText: string = "";
        let index = 0;
        let lastIndex = 0;

        while (index > -1 && index < text.length) {
            // Find the next ANSI escape sequence
            index = text.indexOf('\x1b', index);

            if (index > -1) {
                // Append the text before the ANSI code
                newText = this.AppendText(newText, text.substring(lastIndex, index));
                // Parse and apply the color code
                const [newIndex, colorCode, isBold] = this.ParseColorCode(text, index + 1);
                this.SetColor(colorCode, isBold);
                index = newIndex;
            } else if (lastIndex < text.length) {
                // Append any remaining text
                newText = this.AppendText(newText, text.substring(lastIndex));
            }
            lastIndex = index;
        }

        // Close any open style span
        if (this.InStyle) {
            newText += '</span>';
        }

        return newText;
    }
}