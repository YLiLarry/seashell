import * as React from 'react';
import {map, actionsInterface} from '../../actions';
import {Link} from 'react-router';
import {Tooltip, Position, Dialog} from '@blueprintjs/core';
import {HelpDialog} from './Dialogs';
import * as R from 'ramda';

const logo = require<any>('./logo.svg');
const styles = require<any>('./index.scss');
const layoutStyles = require<any>('../../Layout.scss');

 
export interface NavigationProps { title: string; }
export interface NavigationState { helpVisible?: boolean; }

class Navigation extends React.Component<NavigationProps&actionsInterface, NavigationState>{
  constructor(props:NavigationProps){
    super(props);
    this.state={
      helpVisible: false
    };
  }
  toggleHelp(){
    this.setState({helpVisible: !this.state.helpVisible});
  }
  render(){
    return (<div>
      <nav className={"pt-navbar " + styles.navbar}>
        <div className={layoutStyles.container}>
          <div className="pt-navbar-group pt-align-left">
            <div className="pt-navbar-heading"><Link to="/" className={"pt-button pt-large pt-minimal " + styles.home}><img src={logo} className={styles.logo}/>Seashell</Link></div>
          </div>
          <div className="pt-navbar-group pt-align-right">
            <Tooltip content="Help" position={Position.BOTTOM}><button className="pt-button pt-minimal pt-large pt-icon-help" onClick={this.toggleHelp.bind(this)}></button></Tooltip>
            <Tooltip content="Sync All" position={Position.BOTTOM}><button className="pt-button pt-minimal pt-large pt-icon-import"></button></Tooltip>
            <Tooltip content="Settings" position={Position.BOTTOM}><button className="pt-button pt-minimal pt-large pt-icon-wrench"></button></Tooltip>
            <Tooltip content="Log Out" position={Position.BOTTOM}><button className="pt-button pt-minimal pt-large pt-icon-log-out"></button></Tooltip>
          </div>
        </div> 
      </nav>
      <Dialog className={styles.dialogStyle} title="Seashell Help" isOpen={this.state.helpVisible} onClose={this.toggleHelp.bind(this)}>
        <HelpDialog />
      </Dialog>
    </div>);
  } 
}
 
export default map(Navigation);
