import * as React from 'react';
import * as Showdown from 'showdown';

import {
    getSelection,
    setSelection,
} from './ReactMdeSelectionHelper';
import { Command } from './types/Command';
import { CommandSet } from './types/CommandSet';
import { Value } from './types/Value';
import { HeaderGroup } from './components/HeaderGroup';
import { HeaderItemDropdown } from './components/HeaderItemDropdown';
import { HeaderItem } from './components/HeaderItem';
import { MarkdownHelp } from './components/MarkdownHelp';

export interface ReactMdeProps {
    commands: Array<Array<Command | CommandSet>>;
    value: Value;
    onChange: (value: Value) => void;
    textAreaProps: any;
}

export class ReactMde extends React.Component<ReactMdeProps> {

    converter: Showdown.Converter;
    textArea: HTMLTextAreaElement;

    constructor() {
        super();
        this.converter = new Showdown.Converter();
    }

    /**
     * Handler for the textArea value change
     * @param {any} e
     * @memberOf ReactMde
     */
    handleValueChange = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const {onChange} = this.props;
        onChange({text: e.currentTarget.value, selection: null});
    };

    /**
     * Executes a command
     * @param {function} command
     * @memberOf ReactMde
     */
    executeCommand = (command: Command) => {
        const {value: {text}} = this.props;

        const newValue = command.execute(text, getSelection(this.textArea));

        // let's select EVERYTHING and replace with the result of the command.
        // This will cause an 'inconvenience' which is: Ctrl + Z will select the whole
        // text. But this is the LEAST possible inconvenience. We can pretty much live
        // with it. I've tried everything in my reach, including reimplementing the textArea
        // history. That caused more problems than it solved.

        this.textArea.focus();
        setSelection(this.textArea, 0, this.textArea.value.length);
        document.execCommand('insertText', false, newValue.text);

        setSelection(this.textArea, newValue.selection.start, newValue.selection.end);
    };

    /**
     * Renders react-mde
     * @returns
     * @memberOf ReactMde
     */
    render() {
        const {
            value: {text},
            commands,
            textAreaProps,
        } = this.props;

        const html = this.converter.makeHtml(text) || '<p>&nbsp</p>';

        let header = null;
        if (commands) {
            header = (<div className="mde-header">
                {
                    commands.map((cg: Array<Command | CommandSet>, i: number) => <HeaderGroup key={i}>
                        {
                            cg.map((c: Command | CommandSet, j) => {
                                if (c.type === 'dropdown') {
                                    return (<HeaderItemDropdown
                                        key={j}
                                        icon={c.icon}
                                        commands={(c as CommandSet).subCommands}
                                        onCommand={cmd => this.executeCommand(cmd)}
                                    />);
                                }
                                return <HeaderItem key={j} icon={c.icon} tooltip={c.tooltip}
                                                   onClick={() => this.executeCommand(c as Command)}/>;
                            })
                        }
                    </HeaderGroup>)
                }
            </div>);
        }

        return (
            <div className="react-mde">
                {header}
                <div className="mde-text">
                    <textarea
                        onChange={this.handleValueChange}
                        value={text}
                        ref={(c) => {
                            this.textArea = c;
                        }}
                        {...textAreaProps}
                    />
                </div>
                <div className="mde-preview" dangerouslySetInnerHTML={{__html: html}}/>
                <div className="mde-help">
                    <MarkdownHelp/>
                </div>
            </div>
        );
    }
}
