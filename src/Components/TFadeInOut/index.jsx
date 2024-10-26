import React, { Component } from "react";

const UNMOUNTED = "unmounted";
const EXITED = "exited";
const ENTERING = "entering";
const ENTERED = "entered";
const EXITING = "exiting";

const transitionStyles = {
  entering: { opacity: 0 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 }
};

class TFadeInOut extends Component {
  constructor(props) {
    super(props);

    this.state = { status: UNMOUNTED };
  }

  componentDidMount() {
    const { show } = this.props;
    if (show) {
      this.performEnter();
    }
  }

  componentDidUpdate(prevProps) {
    let nextStatus = null;
    if (prevProps !== this.props) {
      const { status } = this.state;
      if (this.props.show) {
        if (status !== ENTERING && status !== ENTERED) {
          nextStatus = ENTERING;
        }
      } else {
        if (status === ENTERING || status === ENTERED) {
          nextStatus = EXITING;
        }
      }
    }
    this.updateStatus(nextStatus);
  }

  updateStatus(nextStatus) {
    if (nextStatus !== null) {
      if (nextStatus === ENTERING) {
        this.performEnter();
      } else {
        this.performExit();
      }
    } else if (this.state.status === EXITED) {
      this.setState({ status: UNMOUNTED });
    }
  }

  performEnter() {
    this.setState({ status: ENTERING }, () => {
      setTimeout(() => {
        this.setState({ status: ENTERED }, () => {});
      }, 0);
    });
  }

  performExit() {
    const { duration } = this.props;
    this.setState({ status: EXITING }, () => {
      setTimeout(() => {
        this.setState({ status: EXITED }, () => {});
      }, duration);
    });
  }

  render() {
    const { status } = this.state;
    if (status === UNMOUNTED) {
      return null;
    }

    const { children, duration, className, style, onKeyDown, onPaste, onCut } = this.props;
    return (
      <div
        id="editableSection"
        contentEditable
        suppressContentEditableWarning
        className={className}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onCut={onCut}
        // onKeyDown={(e) => { console.log("onBeforeInputCapture>>>>>>>", document.getElementById('2557748c-0755-4056-a5c7-01151dfcea94').textContent)}}
        // onBeforeInputCapture={(e) => { console.log("onBeforeInputCapture>>>>>>>", document.getElementById('2557748c-0755-4056-a5c7-01151dfcea94').textContent)}}
        // onBeforeInput={(e) => {console.log('onBeforeInput>>>>>>>', document.getElementById('2557748c-0755-4056-a5c7-01151dfcea94').textContent)}}
        // onInput={(e) => {e.preventDefault();e.stopPropagation();console.log('onInput>>>>>>>', document.getElementById('2557748c-0755-4056-a5c7-01151dfcea94').textContent)}}
        // onKeyUp={(e) => {console.log('onKeyUp>>>>>>>', document.getElementById('2557748c-0755-4056-a5c7-01151dfcea94').textContent)}}
        // onPaste={(e) => { e.preventDefault(); }}
        style={{
          ...style,
          transition: `opacity ${duration}ms ease-in-out`,
          opacity: 0.1,
          ...transitionStyles[status]
        }}
      >
        {children}
      </div>
    );
  }
}

TFadeInOut.defaultProps = {
  show: false,
  duration: 300
};

export default TFadeInOut;
