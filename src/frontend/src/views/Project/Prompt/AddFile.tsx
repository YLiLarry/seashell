import * as React from "react";
import {merge} from "ramda";
import {map, actionsInterface} from "../../../actions";
import {showError} from "../../../partials/Errors";
import Prompt from "./Prompt";

export interface AddFileProps {
  questions: string[];
  closefunc: Function;
}

interface AddFileState {
  file: string;
  prevFile: string;
  folder: string;
  uploadFiles: File[];
  disabled: boolean;
}

/* Note that this class makes use of the built-in File class,
    so be careful if Seashell's File class needs to be used
    here in the future. */

class AddFile extends React.Component<AddFileProps&actionsInterface, AddFileState> {
  project: string;
  question: string;

  constructor(props: AddFileProps&actionsInterface) {
    super(props);
    if (this.props.appState.currentProject && this.props.appState.currentProject.currentQuestion) {
      this.project = this.props.appState.currentProject.id;
      this.question = this.props.appState.currentProject.currentQuestion.name;
      this.state = {
        file: "",
        prevFile: "",
        folder: this.question,
        uploadFiles: [],
        disabled: false
      };
    } else {
      throw new Error("AddFile invoke on undefined project!");
    }
  }

  private getDefaultContents(filename: string): string {
    const ext = filename.split(".").pop();
    switch (ext) {
      case "c":
        return "\nint main() {\n\treturn 0;\n}\n";
      case "h":
        return "\n// Write your interface here.\n";
      case "rkt":
        return "#lang racket\n\n";
      default:
        return "";
    }
  }

  private filesToArray(files: FileList|null): File[] {
    if (files === null) {
      return [];
    }
    let result = [];
    for (let i = 0; i < files.length; i++) {
      result.push(files[i]);
    }
    return result;
  }

  private submitForm() {
    let proms: Promise<any>[] = [];
    if (this.state.file) {
      proms.push(this.props.dispatch.file.addFile(
        this.project,
        this.question,
        `${this.state.folder}/${this.state.file}`,
        this.getDefaultContents(this.state.file)));
    }
    if (this.state.uploadFiles) {
      proms.concat(this.state.uploadFiles.map((file: File) => new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => {
          this.props.dispatch.file.addFile(
              this.project, this.question, `${this.state.folder}/${file.name}`, reader.result)
            .then(() => resolve())
            .catch(() => reject(file.name));
        };
        reader.onerror = () => {
          reject(file.name);
        };
        reader.readAsDataURL(file);
      })));
    }
    return Promise.all(proms)
      .catch(cause => showError(`Failed to upload file ${cause}.`));
  }

  render() {
    return(<Prompt submitMessage="Add File" closefunc={this.props.closefunc}
        submitfunc={() => this.submitForm()} disable={(val: boolean) =>
          this.setState(merge(this.state, {disabled: val}))}>
      <p>What would you like to call this file?</p>
      <div>
        <label>New File:
          <select className="pt-select" value={this.state.folder}
              onChange={(e) => this.setState(merge(this.state, {folder: e.currentTarget.value}))}>
            <option value={this.question}>{this.question}</option>
            <option value={`${this.question}/tests`}>{this.question}/tests</option>
            <option value="common">common</option>
          </select> / 
          <input className="pt-input" required disabled={this.state.disabled}
            type="text" value={this.state.file} ref={input => input && input.focus()}
          onBlur={() => {
            if (this.state.file === "" || this.state.file.includes("/")) {
              this.setState(merge(this.state, {file: this.state.prevFile}));
            }
            else {
              this.setState(merge(this.state, {prevFile: this.state.file}));
            }
          }}
          onChange={(e => this.setState(merge(this.state, {file: e.currentTarget.value})))}/>
        </label><br />
        <label>Upload Files:
          <input type="file" multiple disabled={this.state.disabled} onChange={
            e => this.setState(merge(this.state, {
              uploadFiles: this.filesToArray(e.currentTarget.files)
            }))
          } />
        </label>
      </div>
    </Prompt>
    );
  }
}

export default map<AddFileProps>(AddFile);
