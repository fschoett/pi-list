# Monitor Feature

With the monitoring feature it is possible to start a recording of a single Multicast stream with a recording buffer of one Minute.

For the recording tcpdump is being used. The data is written in pcap files which contain the data of one second. Because the buffer size is one minute, a total of 60 Files will be generated.

## Usage

To monitor a stream, select a multicast IP and a Port, add a name and hit __Monitor__

If the monitoring process startet, it will keep recording the selected streams until the __Cancel__ button has been klicked.

To analyze a stream, select the duration of the snapshot and hit __Analyze__, or cancel the monitoring.

## Implementation Details

An abstract flowchart of the backend implemenation can be found here:

[Abstract Flowchart PDF](./monitoring_extension-abstract_flowchart.pdf)

## Issues / TODO

- The frontend code, espacially in [this]() file, should be refactored for better readability.
    - Outsource some code in to sub-components
- Improve and double check error handling
- Write tests
- Currently only one monitor is supported. --> Goal should be the possibility to have a list of different monitors
- Capturing performance out of a docker container is not optimal
