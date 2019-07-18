import Loader from '../../components/common/Loader'
import websocketEventsEnum from '../../enums/websocketEventsEnum';
import StreamsListPanel    from './StreamsListPanel';
import React, { Component }from 'react';
import { translateC } from '../../utils/translation';
import MonitorEntry   from './MonitorEntry.js';
import asyncLoader from '../../components/asyncLoader';
import Input     from '../../components/common/Input';
import Notifications  from '../../utils/notifications'
import FormInput from '../../components/common/FormInput';
import websocket from '../../utils/websocket';
import Button from '../../components/common/Button';
import Select from 'react-select';
import api    from '../../utils/api';
import moment from 'moment';
import uuid   from 'uuid/v4';
import _ from 'lodash';
	
class MonitorPanel extends Component {
	constructor(props) {
		super(props);


		this.state = {
			streams: [
				{ src: '', dstAddr: '', dstPort: '' }
			],
			captureDescription: '',
			captureFullName: undefined,
			sdpErrors: null,
			now  : this.getNow(),
			timer: null,
			captureId: undefined,
			captureErrorMessage: undefined,
			availableIfaces : [],
			availableDirs   : [],
			selectedDir   : "",
			selectedIface : "",
			is_busy : false
		};

		this.state.monitorList = this.renderCaptureList(this.props.monitors);
		this.state.monitors    = this.props.monitors;

		props.monitors.streamEndpoints && (
			this.state.streams.splice(0,0, props.monitors.streamEndpoints)
		);

		this.startMonitor     = this.startMonitor.bind(this);
		this.onStreamsChanged = this.onStreamsChanged.bind(this);
		this.onCaptureFullNameChanged = this.onCaptureFullNameChanged.bind(this);
		this.onCaptureFullNameChanged = this.onCaptureFullNameChanged.bind(this);
		this.onCaptureDescriptionChanged = this.onCaptureDescriptionChanged.bind(this);
		this.updateNow    = this.updateNow.bind(this);
		this.getFullName  = this.getFullName.bind(this);
		this.onDirChanged = this.onDirChanged.bind(this);
		this.onIfaceChanged= this.onIfaceChanged.bind(this);
		this.getDirs   = this.getDirs.bind(this);
		this.getIfaces = this.getIfaces.bind(this);
		this.getIfaces();
		this.getDirs();
	}

	componentDidMount() {
		this.startTimer();
	}

	componentWillUnmount() {
	}
 
	startTimer() {
		const timer = setInterval(this.updateNow, 500);
		this.setState({ timer });
	}

	getNow() {
		return moment(Date.now()).format('YYYYMMDD-hhmmss');
	}

	getFullName() {
		if (this.state.captureFullName !== undefined) {
			return this.state.captureFullName;
		} 
		const streamNames = this.state.streams
			.map(stream => stream.dstAddr)
			.filter(name => name)
			.join('-');
		const streams = streamNames ? `-${streamNames}` : '';

		const desc = this.state.captureDescription ? `-${this.state.captureDescription}` : '';
		return `${this.state.now}${streams}${desc}`;
	}

	updateNow() {
		this.setState({ now: this.getNow() });
	}


	startMonitor() {

		const captureFullName = this.getFullName();
		if (captureFullName === '') {
			return;
		}

		this.setState( { is_busy : true } );

		const captureInfo = Object.assign({}, {
			streams: this.state.streams,
			name: captureFullName,
			capture_id: uuid(),
			iface: this.state.selectedIface,
			dir: this.state.selectedDir
		});

		api.startMonitor(captureInfo)
			.then(( res ) => {
				api.getMonitors()
					.then( (res) => {
						this.setState( { monitors : res });
						this.onCaptureListChanged( this.state.monitors );
						this.setState( { is_busy : false } );
					}).catch( err => { 
						console.error( err ) 
						this.setState( { is_busy : false } );
					} );
			})
			.catch((error) => {
				const errorMessage = _.get(error, ['response', 'data', 'message'], '');

				this.setState( { is_busy : false } );
				this.setState({
					captureErrorMessage: errorMessage
				});
		});
}

	analyze(id, time ){
		return api.analyzeMonitoredStream( {captureID:id,duration:time})
			.then( (res) => {
				console.log(res);
				if ( res ){
					Notifications.success( {
							title:"Success", 
							message:"LIST will now analyze the capture in the background" 
						});
					return "success"
				}
				else{
					Notifications.error( {
						title:"Error", 
						message:"An error occured while trying to analyze the stream..." 
					});
					return "analysis failed.."
				}
			}).catch( (err) => {
				console.log(err);
				Notifications.error( {
					title:"Error", 
					message:"An error occured while trying to analyze the stream..." 
				});
				return "analysis failed.."
			});
	}

	stop(id, time ){
		api.stopMonitor( {captureID: id})
			.then( (res) =>{

				var newMonitorList = this.state.monitors.filter( monitor => {
					return monitor.id != id
				});

				this.setState({ monitors : newMonitorList });
				this.onCaptureListChanged();
				Notifications.success( {
					title:"Info",
					message: "Stopped monitoring process"
				});

			}).catch( (err) => {
				console.error(err);
				Notifications.error( {
					title:"error",
					message:"Error trying to stop the monitoring process"
				});
			});
	}
	
	// Fetch the list of available interfaces from the dump_server
	getIfaces(){
		api.getIfaces()
			.then( (ifaceList) => {
				var newIfaceList = ifaceList.map( (value ) =>{
					return {value: value, label: value}
				});
				this.setState( { availableIfaces: newIfaceList } );
				this.setState( { selectedIface  : newIfaceList[0] });
			})
			.catch( err  => {
				console.error( "Error trying to fetch an interface list ");
			});
	}

	// Callback that is called when the user selects an interface
	onIfaceChanged( newValue ){
		this.setState( {selectedIface: newValue});
	}

	// Fetch the LIST of available Capture directorys
	// Each directory has a label and the directory inside the docker container
	// .. where the pcap files are going to be stored
	getDirs(){
		api.getDirs()
			.then( (dirList) => {
				var newDirList = dirList.map( (value) =>{
					return {value: value.dir_docker, label: value.dir_name}
				})
				this.setState( {availableDirs: newDirList});
				this.setState( {selectedDir: newDirList[0]})
			})
	}

	// Callback that is called when the user selects a directory
	onDirChanged( newValue ){
		this.setState( {selectedDir: newValue});
	}

	// Callback that is called when the user selects a new capture-name
	onCaptureFullNameChanged(value) {
		this.setState({ captureFullName: value });
	}

	onCaptureDescriptionChanged(value) {
		this.setState(
			{
				captureDescription: value,
				captureFullName: undefined
			}
		);
	}

	onStreamsChanged( newStreams ) {
		this.setState({
			streams  : newStreams,
			sdpErrors: null,
			captureFullName: undefined
		});
	}

	// Start rendering the list of monitors. 
	// The result is a list of Monitor Entrys
	renderCaptureList( monitors){
		var newMonitorList = monitors.map( (monitor)=>{
			var output = (
				<li key = { monitor.id } className="row">
					<div className="col-xs-12">
						<hr className="row"/>
						<MonitorEntry 
							analyze = { (id, time) => this.analyze(id,time) }
							stop    = { (id, time) => this.stop(id,time) }
							m_id    = { monitor.id}
							directory={ monitor.directory }
							iface   = { monitor.iface }
							multicast_ip = { monitor.multicast_ip }
							port    = { monitor.port }
							file_name={ monitor.file_name }
							from_nmos={ monitor.from_nmos }
						></MonitorEntry>
					</div>
				</li>
			);
			return output;
		});
		return newMonitorList;
	}


	onCaptureListChanged(){
		var newMonitorList = this.renderCaptureList( this.state.monitors );
		this.setState( { monitorList : newMonitorList } );
	}

	render() {
		const colSizes = { labelColSize: 1, valueColSize: 11 };
		const captureFullName = this.getFullName();

		return (
			<div>
				<div>
					<div className ="row">
						<div className="col-xs-6">
							<Select
								placeholder= "Capture Dir."
								clearable  = { false }
								options    = { this.state.availableDirs }
								value      = { this.state.selectedDir }
								onChange   = { this.onDirChanged }
							/>
						</div>
						<div className="col-xs-6">
							<Select
								placeholder= "Capture Iface:"
								clearable  = { false }
								options    = { this.state.availableIfaces }
								value      = { this.state.selectedIface }
								onChange   = { this.onIfaceChanged }
							/>
						</div>
					</div>

					<div className="lst-sdp-config lst-no-margin">
						<StreamsListPanel 
							streams     = { this.state.streams } 
							handleChange= { this.onStreamsChanged } />
						<hr/> 
						<FormInput icon="receipt" {...colSizes}>
							<Input
								type  = "text"
								value = { this.state.captureDescription }
								onChange = { evt => {
									this.onCaptureDescriptionChanged(evt.target.value)
								}}
							/>
						</FormInput>
					</div>

					<hr />
					<div className="row lst-align-items-center lst-no-margin lst-margin--bottom-1">
						<div className="col-xs-11 lst-no-margin">
							<FormInput {...colSizes} 
								icon="label" 
								className="lst-no-margin"
							>
								<Input
									type = "text"
									value= { captureFullName }
									onChange = { evt => {
										this.onCaptureFullNameChanged(evt.target.value)}
									}
								/>
							</FormInput>
						</div>
						<div className="col-xs-1">
							<Button
								className="lst-table-delete-item-btn lst-no-margin lst-no-padding"
								icon = "cancel"
								type = "info"
								link
								onClick = { () => {
									this.setState({ captureFullName: undefined })}
								}
							/>
						</div>
					</div>

				</div>


				<div className="row lst-align-items-center">
					<div className="col-xs-8">
					</div>
					<div className="col-xs-4 lst-text-right end-xs">
						{ this.state.is_busy ? (
							<Loader size="small"></Loader>
						) : (
							<Button
							type   = "info"
							label  = "Monitor"
							onClick= {this.startMonitor}
							/>
						)}
					</div>
				</div>
				<ul>{ this.state.monitorList }</ul>
			</div>
		);
	}
}

// Fetch the list of running monitors before everything else
export default asyncLoader(MonitorPanel, {
	asyncRequests: {
		monitors: () => api.getMonitors()
	}
});
