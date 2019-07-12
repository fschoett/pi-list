import React, { Component } from 'react';
import Input  from '../../components/common/Input';
import Button from '../../components/common/Button';
import api    from '../../utils/api';


class MonitorEntry extends Component {
	constructor( props ){
		super( props );
		this.state = {
			duration: 2,
			status : "monitoring"
		};

		this.analyze = this.props.analyze;
		this.stop    = this.props.stop;
	}

	statusTimeout(){
		const TIMEOUT = 3000 ;

		setTimeout( ()=>{
			this.setState( { status: "monitoring" } );
			console.log( " MONITORING AGAIN ");
		}, TIMEOUT )
	}


	render(){
		return (
			<div className="row lst-align-items-center lst-no-margin" >
				<div className="col-xs-4">
					<span className="row">IP: {this.props.multicast_ip}</span>
					<span className="row">Port: {this.props.port} </span>
					<span className="row">Iface: {this.props.iface}</span>
					<span className="row">{this.state.status}</span>
				</div>
				
				<div className="col-xs-4">
					<span className="row">Name: {this.props.file_name}</span>
					<span className="row">Dir: {this.props.directory}</span>
					<Input
						width="4rem"
						type ="number"
						min="0"
						max="60"
						value={this.state.duration}
						onChange={evt => this.setState({ 
								duration: parseInt(evt.currentTarget.value, 10)
						})}
					/>
				</div>
				<div className="col-xs-2 lst-text-right end-ex">
					<Button
						type ="info"
						label="Analyze"
						onClick={ () => {
							this.setState( {status : "analyzing"} );
							this.analyze(this.props.m_id, this.state.duration)
								.then( res => {
									this.setState( { status : res } );
									this.statusTimeout();
								})
								.catch( err => this.setState( { state: "ERROR" }) );
							}
						}
					/>
				</div>
				{ !this.props.from_nmos ? (
					<div className="col-xs-2 lst-text-right end-ex">
						<Button
							type ="danger"
							label="Cancel"
							onClick={ () => {
								this.stop(this.props.m_id, this.state.duration)}
							}
						/>
					</div>
				) : (
					<span className="col-xs-2 lst-text-right end-ex" > NMOS </span>
				)	
				}

			</div>
		);
	}


}
export default MonitorEntry;
