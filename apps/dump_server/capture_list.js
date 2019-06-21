class CaptureList{
    constructor(){
        this.captures = {};
    }

    addCapture( capture ){
        if( capture ){
            if( capture.id ) this.captures[ capture.id ] = capture;
        }
    }

    removeCapture( captureID ){
        if( captureID ){
            if( this.captures[ captureID ] ){
                // make this async
                this.captures[ captureID ].stopCapture();
                delete this.captures[ captureID ]
            }
        }
    }

    getSingleCapture( captureID ){
        return this.captures[ captureID ];
    }

    getCaptures(){
        var output = [];
        for( var capt in this.captures ){
            output.push( this.captures[capt].id );
        }
        return output;
    }

    removeAllCaptures(){
        for( var capt in this.captures ){
            this.captures[capt].stopCapture();
        }
        this.captures = {}
    }
}

module.exports = CaptureList;