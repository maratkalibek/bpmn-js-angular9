import {
  AfterContentInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import { HttpClient } from '@angular/common/http';

/**
 * You may include a different variant of BpmnJS:
 *
 * bpmn-viewer  - displays BPMN diagrams without the ability
 *                to navigate them
 * bpmn-modeler - bootstraps a full-fledged BPMN editor
 */
// import * as BpmnJS from 'bpmn-js/dist/bpmn-navigated-viewer.development.js';
import * as BpmnJS from 'bpmn-js/dist/bpmn-modeler.production.min.js';

import { importDiagram } from './rx';

import { throwError } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss']
})
export class DiagramComponent implements AfterContentInit, OnDestroy, OnChanges {

  // instantiate BpmnJS with component
  private viewer: BpmnJS = new BpmnJS();

  // retrieve DOM element reference
  @ViewChild('ref', {static: true}) private el: ElementRef;

  @Output() private importDone: EventEmitter<any> = new EventEmitter();

  @Input() private url: string;

  constructor(private http: HttpClient) {

  }

  ngAfterContentInit(): void {
    console.log(this.el);
    // attach BpmnJS instance to DOM element
    this.viewer.attachTo(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    // destroy BpmnJS instance
    this.viewer.destroy();
  }

  ngOnChanges(changes: SimpleChanges) {
    // re-import whenever the url changes
    if (changes.url) {
      this.loadUrl(changes.url.currentValue);
    }
  }

  loadUrl(url: string) {
    return (
      this.http.get(url, { responseType: 'text' }).pipe(
        catchError(err => throwError(err)),
        importDiagram(this.viewer)
      ).subscribe(
        (warnings) => {
          this.importDone.emit({
            type: 'success',
            warnings
          });
        },
        (err) => {
          this.importDone.emit({
            type: 'error',
            error: err
          });
        }
      )
    );
  }
}
