import React, { Component } from 'react';
import ReactDOM from 'react-dom';


const Draggable = ({ direction, onMouseDown }) => {

  const column = direction === 'column';

  const style = {
    width: column ? '100%' : 0,
    height: !column ? '100%' : 0,
    position: 'relative'
  }

  const inner = {
    position: 'absolute',
    background: 'var(--color-border)',
    cursor: column ? 'row-resize' : 'col-resize',
    left: column ? 0 : -6,
    top: !column ? 0 : -6,
    width: column ? '100%' : 11,
    height: !column ? '100%' : 11
  }

  return (
    <div style={style}>
      <div onMouseDown={onMouseDown}  style={inner} />
    </div>
  );
}


export class ResizablePanels extends Component {

  constructor(props) {
    super(props);

    this.resizable = React.createRef();
    this.state = this.state;
  }

  state = {
    panelsSize: [],
    resizing: false
  };

  componentDidMount() {
    this.setState({ ...this.state, panelsSize: this.props.panelsSize });

    ReactDOM.findDOMNode(this).addEventListener(
      'mousemove',
      this.executeResize
    );
    ReactDOM.findDOMNode(this).addEventListener('mouseup', this.stopResize);
    ReactDOM.findDOMNode(this).addEventListener('mouseleave', this.stopResize);
  }

  render() {

    const rest =
      this.props.children.length > 1 ? this.props.children.slice(1) : [];

    return (
      <div
        className={this.props.className}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: this.props.direction || 'row'
        }}
        ref={this.resizable}
      >
        {this.renderChildren(0)}
        {this.renderDraggable()}
        {this.renderChildren(1)}
      </div>
    );
  }

  renderChildren(index) {
    return (
      <div className="resizable-fragment" style={this.getStyle(index)}>{this.props.children[index]}</div>
    );
  }

  renderDraggable() {
    return (
      <Draggable
        direction={this.props.direction}
        onMouseDown={e => this.startResize(e)}
        color={this.props.resizerColor}
      />
    );
  }

  displayDirectionIsColumn() {
    return this.props.direction === 'column' ? true : false;
  }

  getStyle(index) {

    const panelsSize = this.state.panelsSize || [];
    const panelsSizeLength = panelsSize.length - 1;
    const size = index > panelsSizeLength ? '100%' : panelsSize[index];
    const unitMeasure = this.props.sizeUnitMeasure || 'px';

    if (this.displayDirectionIsColumn()) {
      return {
        height: `${size}${unitMeasure}`,
        width: `100%`,
        overflow: 'hidden'
      };
    }

    return {
      height: `100%`,
      width: `${size}${unitMeasure}`,
      overflow: 'hidden'
    };
  }

  startResize(e) {

    e.preventDefault();

    this.setState({
      ...this.state,
      resizing: true,
      currentPanel: 1,
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
      currentPanel: null,
      displacement: 0
    });

    if (this.props.stopResize) {
      this.props.stopResize();
    }
  };

  getCurrentComponentSize() {

    const componentSizes = this.resizable.current.getBoundingClientRect();

    return this.displayDirectionIsColumn()
      ? componentSizes.height
      : componentSizes.width;
  }

  getNextPanelsSize(displacement) {

    const currentPanelsSize = this.state.panelsSize;
    const usePercentage = this.props.sizeUnitMeasure === '%';

    const resizeSize = usePercentage
      ? this.convertToPercentage(displacement)
      : displacement;

    const newPanelsSize = currentPanelsSize.map((panelSize, index) => {

      if (index === this.state.currentPanel) {
        return panelSize + resizeSize;
      } else if (index === this.state.currentPanel - 1) {
        return panelSize - resizeSize;
      }

      return panelSize;
    });

    return newPanelsSize;
  }

  convertToPercentage(displacement) {
    const size = this.getCurrentComponentSize();

    return (displacement * 100) / size;
  }
}