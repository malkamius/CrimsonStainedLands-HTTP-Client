enum Options {
    ECHO = 1,
    MUDServerStatusProtocolVariable = 1,
    MUDServerStatusProtocolValue = 2,
    SupressGoAhead = 3,
    TelnetType = 24,
    MUDServerStatusProtocol = 70,
    MUDSoundProtocol = 90,
    MUDeXtensionProtocol = 91,
    SubNegotiationEnd = 240,
    GoAhead = 249,
    SubNegotiation = 250,
    WILL = 251,
    DO = 253,
    WONT = 252,
    DONT = 254,
    InterpretAsCommand = 255,
}

export class TelnetOption {
    public Enabled: boolean = false;
}

export class EchoOption extends TelnetOption {}

export class SupressGoAhead extends TelnetOption {}

export class NegotiateResponse {
    public NewInput: Uint8Array = new Uint8Array();
    public Response: Uint8Array = new Uint8Array();
}

export class TelnetNegotiator {
    public Options: Array<TelnetOption> = [];
    private SupportedClientTypes: Array<string> = ["256COLOR", "VT100", "ANSI"];
    private NegotiatedClientTypes: Array<string> = [];
    private currentTypeIndex: number = -1;

    private readonly ClientNegotiateTelnetType: Uint8Array = new Uint8Array([
        Options.InterpretAsCommand,
        Options.SubNegotiation,
        Options.TelnetType,
        0
    ]);

    public IsNegotiationRequired(input: Uint8Array): boolean {
        return input.includes(Options.InterpretAsCommand);
    }

    public Negotiate(input: Uint8Array): NegotiateResponse {
        const response = new NegotiateResponse();
        let i = 0;
        let lastIndex = 0;
        
        while (i < input.length) {
            if (input[i] === Options.InterpretAsCommand) {
                response.NewInput = this.concatUint8Arrays(response.NewInput, input.slice(lastIndex, i));
                i++; // Move past IAC
                if (i >= input.length) break;

                const command = input[i];
                i++; // Move past command

                switch (command) {
                    case Options.DO:
                    case Options.DONT:
                    case Options.WILL:
                    case Options.WONT:
                        if (i >= input.length) break;
                        const option = input[i];
                        i++; // Move past option
                        response.Response = this.concatUint8Arrays(response.Response, this.handleCommand(command, option));
                        break;
                    
                    case Options.SubNegotiation:
                        const subNegResponse = this.handleSubNegotiation(input.slice(i));
                        response.Response = this.concatUint8Arrays(response.Response, subNegResponse);
                        i += this.findSubNegotiationEnd(input.slice(i)) + 1;
                        break;
                }
                lastIndex = i;
            } else {
                i++; // Move to next character if not IAC
            }
        }
        
        response.NewInput = this.concatUint8Arrays(response.NewInput, input.slice(lastIndex));

        return response;
    }

    private handleCommand(command: number, option: number): Uint8Array {
        switch (option) {
            case Options.TelnetType:
                if (command === Options.DO || command === Options.WILL) {
                    return this.SendNextClientType();
                }
                break;
            // Add more cases for other options as needed
        }
        return new Uint8Array();
    }

    private handleSubNegotiation(input: Uint8Array): Uint8Array {
        if (input[0] === Options.TelnetType && input[1] === 1) {
            return this.SendNextClientType();
        }
        return new Uint8Array();
    }

    private findSubNegotiationEnd(input: Uint8Array): number {
        for (let i = 0; i < input.length - 1; i++) {
            if (input[i] === Options.InterpretAsCommand && 
                input[i + 1] === Options.SubNegotiationEnd) {
                return i + 1;
            }
        }
        return input.length;
    }

    public SendNextClientType(): Uint8Array {
        this.currentTypeIndex = (this.currentTypeIndex + 1) % this.SupportedClientTypes.length;
        const clientType = this.SupportedClientTypes[this.currentTypeIndex];
        
        const clientTypeBytes = new TextEncoder().encode(clientType);
        return this.concatUint8Arrays(
            this.ClientNegotiateTelnetType,
            clientTypeBytes,
            new Uint8Array([Options.InterpretAsCommand, Options.SubNegotiationEnd])
        );
    }

    private concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
        const totalLength = arrays.reduce((acc, value) => acc + value.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const array of arrays) {
            result.set(array, offset);
            offset += array.length;
        }
        return result;
    }
}