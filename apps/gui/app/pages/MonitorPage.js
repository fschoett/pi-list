import React from 'react';
import PcapList from '../containers/PcapList';
import Panel from '../components/common/Panel';
import MonitorPanel from '../containers/monitor/MonitorPanel';
import { translateX } from '../utils/translation';

const CapturePage = props => (
    <div className="row">
        <div className="col-xs-12 col-md-3 col-lg-4">
            <Panel title={translateX('headings.monitor_manager')}>
                <MonitorPanel />
            </Panel>
        </div>
        <div className="col-xs-12 col-md-9 col-lg-8">
            <Panel title={translateX('headings.last_pcaps')}>
                <PcapList />
            </Panel>
        </div>
    </div>
);

export default CapturePage;
