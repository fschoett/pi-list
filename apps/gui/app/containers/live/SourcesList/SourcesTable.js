import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import sources from 'ebu_list_common/capture/sources';
import { translateX } from '../../../utils/translation';
import Icon from '../../../components/common/Icon';

import {
    getGetTdProps,
    getCheckBoxColumn,
} from '../../../components/table/utils';

const SourcesTable = props => {
    const columns = [
        getCheckBoxColumn(props),
        {
            Header: translateX('live.sources.name'),
            headerClassName: 'lst-text-left lst-table-header',
            accessor: 'meta.label',
            className: 'lst-text-left',
        },
        {
            Header: '',
            headerClassName: 'lst-text-left lst-table-header',
            accessor: 'kind',
            className: 'lst-text-center',
            Cell: renderKind,
            width: 60,
        },
        {
            Header: '',
            headerClassName: 'lst-text-left lst-table-header',
            accessor: 'meta.format',
            className: 'lst-text-left',
            Cell: renderIcon,
            width: 40,
        },
        {
            Header: translateX('live.sources.destination_address'),
            headerClassName: 'lst-text-left lst-table-header',
            accessor: 'meta.network.destination',
            className: 'lst-text-left',
        },
        {
            Header: translateX('live.sources.format'),
            headerClassName: 'lst-text-left lst-table-header',
            accessor: 'media_specific.resolution',
            className: 'lst-text-left',
        },
    ];

    return (
        <ReactTable
            data={props.data}
            columns={columns}
            defaultPageSize={10}
            className="-highlight lst-text-center"
            getTdProps={getGetTdProps(props)}
            defaultSorted={[
                {
                    id: 'date',
                    desc: true,
                },
            ]}
            NoDataComponent={props.noDataComponent}
        />
    );
};

const getIconValue = value => {
    switch (value) {
        case 'urn:x-nmos:format:video':
            return 'videocam';
        case 'urn:x-nmos:format:audio':
            return 'audiotrack';
        case 'urn:x-nmos:format:data':
            return 'description';

        default:
            return 'help';
    }
};

const renderIcon = ({ value }) => {
    return (
        <span className="stream-type-number">
            <Icon value={getIconValue(value)} />
        </span>
    );
};

const renderKind = ({ value }) => {
    switch (value) {
        case sources.kinds.user_defined:
            return <Icon value={'person'} />;

        case sources.kinds.from_sdp:
            return <span>SDP</span>;

        case sources.kinds.nmos:
            return <img src="/static/nmos.png" alt="NMOS logo" width="45px" />;

        default:
            return '';
    }
};

SourcesTable.propTypes = {
    data: PropTypes.arrayOf(PropTypes.any),
    selectedIds: PropTypes.arrayOf(PropTypes.string),
    selectAll: PropTypes.number,
    onSelectId: PropTypes.func,
    onSelectAll: PropTypes.func,
    onClickRow: PropTypes.func,
    noDataComponent: PropTypes.func,
};

SourcesTable.defaultProps = {
    data: [],
    selectedIds: [],
    selectAll: 0,
    onSelectId: () => {},
    onSelectAll: () => {},
    onClickRow: () => {},
    noDataComponent: () => null,
};

export default SourcesTable;
