import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { simpleDebounce$ } from '../../../../a-i18n-core-js/index.js';
import { MessageTypes } from '../../../core/constants.js';

import { VsCode } from './VsCode.js';


const Draggable = ({ onMouseDown }) => {
  return (
    <div className='lrp-draggable'>
      <div className='lrp-area' onMouseDown={onMouseDown}>
        <div className='lrp-line'></div>
      </div>
    </div>
  );
}


export class ResizablePanels extends Component {

  constructor(props) {
    super(props);

    this.resizable = React.createRef();

    this.saveSize = simpleDebounce$(() => {

      if (this.state.panelsSize && this.props.stateKey) {
        VsCode.postMessage({
          type: MessageTypes.UpdateWorkspaceState,
          [this.props.stateKey]: this.state.panelsSize
        });
      }

    }, 500);

    const className = ['g-resizable-planes', this.props.className, this.props.direction].join(' ');

    this.state = {
      className,
      panelsSize: this.props.panelsSize,
      resizing: false
    }
  }

  componentDidMount() {
    const dom = ReactDOM.findDOMNode(this);
    dom.addEventListener('mousemove', this.executeResize);
    dom.addEventListener('mouseup', this.stopResize);
    dom.addEventListener('mouseleave', this.stopResize);
  }

  componentWillUnmount() {
    const dom = ReactDOM.findDOMNode(this);
    dom.removeEventListener('mousemove', this.executeResize);
    dom.removeEventListener('mouseup', this.stopResize);
    dom.removeEventListener('mouseleave', this.stopResize);
  }

  render() {


    return (
      <div className={this.state.className} ref={this.resizable}>
        {this.renderChildren(0)}
        <Draggable onMouseDown={e => this.startResize(e)}/>
        {this.renderChildren(1)}
      </div>
    );
  }

  renderChildren(index) {
    return (
      <div className="lrp-panel" style={this.getStyle(index)}>{this.props.children[index]}</div>
    );
  }

  displayDirectionIsColumn() {
    return this.props.direction === 'column' ? true : false;
  }

  getStyle(index) {

    const size = this.state.panelsSize[index];

    if (this.displayDirectionIsColumn()) {
      return {
        height: `${size}%`
      };
    }

    return {
      width: `${size}%`
    };
  }

  startResize(e) {

    e.preventDefault();

    this.setState({
      ...this.state,
      resizing: true,
      initialPos: this.displayDirectionIsColumn() ? e.clientY : e.clientX
    });

    if (this.props.startResize) {
      this.props.startResize();
    }
  }

  executeResize = e => {
    if (this.state.resizing) {

      const currentMousePosition = this.displayDirectionIsColumn()
        ? e.clientY
        : e.clientX;

      const displacement = this.state.initialPos - currentMousePosition;

      const nextPanelsSize = this.getNextPanelsSize(displacement);
      this.saveSize();

      this.setState({
        ...this.state,
        initialPos: currentMousePosition,
        panelsSize: nextPanelsSize,
        displacement
      });

      if (this.props.onResize) {
        this.props.onResize(displacement);
      }
    }
  };

  stopResize = () => {

    this.setState({
      ...this.state,
      resizing: false,
      displacement: 0
    });

    if (this.props.stopResize) {
      this.props.stopResize();
    }
  };

  getNextPanelsSize(displacement) {

    const componentSizes = this.resizable.current.getBoundingClientRect();

    const size = this.displayDirectionIsColumn() ? componentSizes.height : componentSizes.width;

    const resizeSize = (displacement * 100) / size;

    const [min, max] = this.props.panelsMinMax;
    const nextFirstSize = Math.max(min, Math.min(max, this.state.panelsSize[0] - resizeSize))

    return [nextFirstSize, 100.0 - nextFirstSize];
  }

}