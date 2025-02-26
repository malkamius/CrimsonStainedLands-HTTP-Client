// Define interfaces for our settings data structures

export interface Trigger {
    match: string;
    type: string;     // 'regex', 'substring', or 'exact'
    actions: string;  // Command text or JavaScript code
    actionType: string; // 'text' or 'javascript'
}

export interface Alias {
    alias: string;
    command: string;
}

export interface Variable {
    name: string;
    type: string;
    value: string;
}

export interface KeyBinding {
    key: string;
    commands: string;
}

export class AppSettings {
    fontSize: number = 14;
    backgroundColor: string = "#000000";
    foregroundColor: string = "#FFFFFF";
    Aliases: Alias[] = [
        {alias: "'", command: "say"},
        {alias: ".", command: "yell"}
    ];
    Keybindings: KeyBinding[] = [
        {key: 'Numpad8', commands: 'north'},
        {key: 'Numpad6', commands: 'east'},
        {key: 'Numpad2', commands: 'south'},
        {key: 'Numpad4', commands: 'west'},
        {key: 'Numpad9', commands: 'up'},
        {key: 'Numpad3', commands: 'down'},
        {key: 'Numpad5', commands: 'look'},
        {key: 'Escape', commands: '/selectinput'}
    ];
    Variables: Variable[] = [];
    Triggers: Trigger[] = [];
}