import notifics from '../../utils/notifications'
import websocketEventsEnum from '../../enums/websocketEventsEnum';
import StreamsListPanel    from './StreamsListPanel';
import React, { Component }from 'react';
import { translateC } from '../../utils/translation';
import MonitorEntry   from './MonitorEntry.js';
import asyncLoader from '../../components/asyncLoader';
import Input     from '../../components/common/Input';
import FormInput from '../../components/common/FormInput';
import websocket from '../../utils/websocket';
import Button from '../../components/common/Button';
import Select from 'react-select';
import api    from '../../utils/api';
import moment from 'moment';
import uuid   from 'uuid/v4';
import _ from 'lodash';

const monitorStatus = {
	noCapture: 'noCapture',
	inProgress: 'inProgress',
	analyzing: 'analyzing',
	completed: 'ended',
	failed: 'failed',
	is_monitoring: 'is_monitoring'
};

	
const getCaptureStatusMessage = (status, captureErrorMessage) => {
	switch (status) {
		case monitorStatus.noCapture:
			return <span />;
		case monitorStatus.inProgress:
			return <span>In progress</span>;
		case monitorStatus.analyzing:
			return <span>Analyzing</span>;
		case monitorStatus.completed:
			return <span>Monitoring stopped</span>;
		case monitorStatus.failed:
			return <span>Monitoring failed: {captureErrorMessage}</span>;
		case monitorStatus.is_monitoring:
			return <span>Is monitoring</span>
		default:
			return <span>Unknown</span>;
	}
};

class MonitorPanel extends Component {
	constructor(props) {
		super(props);


		this.state = {
			streams: [
				{ src: '', dstAddr: '', dstPort: '' }
			],
			duration: 2,
			captureDescription: '',
			captureFullName: undefined,
			sdpErrors: null,
			now: this.getNow(),
			timer: null,
			is_monitoring: props.monitor.length,
			monitorStatus: monitorStatus.noCapture,
			captureId: undefined,
			captureErrorMessage: undefined,
			availableIfaces: [],
			availableDirs: [],
			selectedDir: "",
			selectedIface: ""
		};
		notifics.success( {} );
		this.state.monitorList = this.renderCaptureList(this.props.monitors);

		this.state.monitors = this.props.monitors;

		if( this.state.is_monitoring ){
			this.state.monitorStatus= monitorStatus.is_monitoring;
		}

		props.monitor.streamEndpoints && (
			this.state.streams.splice(0,0, props.monitor.streamEndpoints)
		);

		this.startMonitor = this.startMonitor.bind(this);
		this.onPcapProcessingEnded = this.onPcapProcessingEnded.bind(this);
		this.onStreamsChanged = this.onStreamsChanged.bind(this);
		this.onCaptureFullNameChanged = this.onCaptureFullNameChanged.bind(this);
		this.onCaptureFullNameChanged = this.onCaptureFullNameChanged.bind(this);
		this.onCaptureDescriptionChanged = this.onCaptureDescriptionChanged.bind(this);
		this.updateNow = this.updateNow.bind(this);
		this.getFullName = this.getFullName.bind(this);
		this.onDirChanged = this.onDirChanged.bind(this);
		this.onIfaceChanged= this.onIfaceChanged.bind(this);
		this.getDirs = this.getDirs.bind(this);
		this.getIfaces = this.getIfaces.bind(this);
		this.getIfaces();
		this.getDirs();
	}

	componentDidMount() {
		this.startTimer();
		websocket.on(websocketEventsEnum.LIVE.IP_PARSED_FROM_SDP, this.onSdpParsed);
		websocket.on(websocketEventsEnum.LIVE.SDP_VALIDATION_RESULTS, this.onSdpValidated);
		websocket.on(websocketEventsEnum.PCAP.DONE, this.onPcapProcessingEnded);
		websocket.on(websocketEventsEnum.PCAP.FILE_FAILED, this.onPcapProcessingEnded);
	}

	componentWillUnmount() {
		websocket.off(websocketEventsEnum.LIVE.IP_PARSED_FROM_SDP, this.onSdpParsed);
		websocket.off(websocketEventsEnum.LIVE.SDP_VALIDATION_RESULTS, this.onSdpValidated);
		websocket.off(websocketEventsEnum.PCAP.DONE, this.onPcapProcessingEnded);
		websocket.off(websocketEventsEnum.PCAP.FILE_FAILED, this.onPcapProcessingEnded);
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

	onPcapProcessingEnded(data) {
		const uuid = _.get(data, ['id']);
		if (uuid === this.state.captureId) {
			this.setState({ monitorStatus: monitorStatus.completed });
			this.startTimer();
		}
	}

	startMonitor() {
		this.setState( {is_monitoring: true});

		const captureFullName = this.getFullName();
		if (captureFullName === '') {
			return;
		}

		const captureInfo = Object.assign({}, {
			streams: this.state.streams,
			duration: this.state.duration,
			name: captureFullName,
			capture_id: uuid(),
			iface: this.state.selectedIface,
			dir: this.state.selectedDir
		});

		this.setState(
			prevState => Object.assign({}, ...prevState, {
				monitorStatus: monitorStatus.inProgress,
				captureId: captureInfo.capture_id
			}),
			() => {
				api.startMonitor(captureInfo)
					.then(( res ) => {
						console.log( res );
						this.setState({
							monitorStatus: monitorStatus.is_monitoring
						});
						api.getMonitors()
							.then( (res) => {
								console.log( res );
								this.setState( { monitors : res });
								this.onCaptureListChanged( this.state.monitors );
							}).catch( err => { console.error( err ) } );

					})
					.catch((error) => {
						const errorMessage = _.get(error, ['response', 'data', 'message'], '');

						this.setState({
							monitorStatus: monitorStatus.failed,
							captureErrorMessage: errorMessage
						});
					});
			});
	}

	analyze(id, time ){
		return api.analyzeMonitoredStream( {captureID:id,duration:time})
			.then( (res) => {
				console.log(res);
				if ( res.ok ){
					notifics.success( {
						title:"Success", 
						message:"LIST will now analyze the capture in the background" 
					});
					return "success"
				}
				else{
					notifics.error( {
						title:"Error", 
						message:"An error occured while trying to analyze the stream..." 
					});
					return "analysis failed.."
				}
			}).catch( (err) => {
				console.log(err);
				notifics.error( {
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

			}).catch( (err) => {
				console.error(err);
			});
	}

	getIfaces(){
		api.getIfaces()
			.then( (ifaceList) => {
				console.log(ifaceList);
				var newIfaceList = ifaceList.map( (value ) =>{
					return {value: value, label: value}
				});
				this.setState( {availableIfaces: newIfaceList} );
				this.setState( {selectedIface: newIfaceList[0]})
			})
	}

	onIfaceChanged( newValue ){
		this.setState( {selectedIface: newValue});
	}

	getDirs(){
		api.getDirs()
			.then( (dirList) => {
				console.log(dirList);
				var newDirList = dirList.map( (value) =>{
					return {value: value.dir_docker, label: value.dir_name}
				})
				this.setState( {availableDirs: newDirList});
				this.setState( {selectedDir: newDirList[0]})
			})
	}

	onDirChanged( newValue ){
		this.setState( {selectedDir: newValue});
	}

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

	onStreamsChanged(newStreams) {
		this.setState({
			streams: newStreams,
			sdpErrors: null,
			captureFullName: undefined
		});
	}

	renderCaptureList( monitors){
		// Render monitor list
		var newMonitorList = monitors.map( (monitor)=>{
			var output = (
				<li key={monitor.id} className="row">
					<div className="col-xs-12">
						<hr className="row"/>
						<MonitorEntry 
							analyze={ (id, time) => this.analyze(id,time) }
							stop={(id, time) => this.stop(id,time) }
							m_id={monitor.id}
							directory={monitor.directory}
							iface={monitor.iface}
							multicast_ip={monitor.multicast_ip}
							port={monitor.port}
							file_name={monitor.file_name}
							from_nmos={monitor.from_nmos}
							status="ja"
						></MonitorEntry>
					</div>
				</li>
			);
			return output;
		});
		return newMonitorList;
	}


	onCaptureListChanged(){
		var newMonitorList = this.renderCaptureList(this.state.monitors);
		this.setState( {monitorList : newMonitorList });
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
								clearable={false}
								placeholder="Capture Dir."
								options={this.state.availableDirs}
								value={this.state.selectedDir}
								onChange={this.onDirChanged}
							/>
						</div>
						<div className="col-xs-6">
							<Select
								clearable={false}
								placeholder="Capture Iface:"
								options={this.state.availableIfaces}
								value={this.state.selectedIface}
								onChange={this.onIfaceChanged}
							/>
						</div>
					</div>

					<div className="lst-sdp-config lst-no-margin">
						<StreamsListPanel 
							streams={this.state.streams} 
							handleChange={this.onStreamsChanged} />
						<hr/> 
						<FormInput icon="receipt" {...colSizes}>
							<Input
								type="text"
								value={this.state.captureDescription}
								onChange={evt => {
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
									type="text"
									value={captureFullName}
									onChange={evt => {
										this.onCaptureFullNameChanged(evt.target.value)}
									}
								/>
							</FormInput>
						</div>
						<div className="col-xs-1">
							<Button
								className="lst-table-delete-item-btn lst-no-margin lst-no-padding"
								icon="cancel"
								type="info"
								link
								disabled={this.state.captureFullName === undefined}
								onClick={() => {
									this.setState({ captureFullName: undefined })}
								}
							/>
						</div>
					</div>

				</div>


				<div className="row lst-align-items-center">
					<div className="col-xs-10">
						{getCaptureStatusMessage(
							this.state.monitorStatus,
							this.state.captureErrorMessage
						)}
					</div>
					<div className="col-xs-2 lst-text-right end-xs">
						<Button
						type="info"
						label="Monitor"
						onClick={this.startMonitor}
						disabled={
							this.state.monitorStatus === monitorStatus.inProgress
							|| this.state.monitorStatus === monitorStatus.analyzing
							|| this.getFullName() === ''}
						/>
					</div>
				</div>
				<ul>{ this.state.monitorList }</ul>
			</div>
		);
	}
}


export default asyncLoader(MonitorPanel, {
	asyncRequests: {
		monitor: () => api.getMonitor(),
		monitors: ()=> api.getMonitors()
	}
});
