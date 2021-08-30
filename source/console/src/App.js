/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
import React from 'react';
import ReactPlayer from 'react-player';
import ListGroup from 'react-bootstrap/ListGroup'
import Button from 'react-bootstrap/Button';
import CardDeck from 'react-bootstrap/CardDeck';
import Card from 'react-bootstrap/Card';

declare var awsExports;
//import awsExports from './aws-exports';

class App extends React.Component {
  state = {
    url: null,
    playing: false,
    stream: "STREAM"
  }

  load = (url,stream) => {
    this.setState({
      url:url,
      stream:stream,
      played: 0,
      playing: true
    })
  }

  ref = player => {
    this.player = player
  }

  render() {
    const { url, stream, playing } = this.state
  
    return (
      <div className="main">
        <h1>Live Streaming on AWS</h1>
        <p>
          This demo provides a preview player for the HLS, DASH and CMAF CloudFront endpoints created by the <a href="https://aws.amazon.com/solutions/implementations/live-streaming-on-aws/?did=sl_card&trk=sl_card" target="_blank" rel="noopener noreferrer">Live Stream on AWS solution</a>.  
			  </p>

        <div className='player-wrapper'>
        <ReactPlayer
          ref={this.ref}
          className='react-player'
          url={url}
          playing={playing}
          controls
          width='100%'
          height='100%'
        />
        </div>
        
        <ListGroup horizontal>
          <ListGroup.Item><b>{stream}</b></ListGroup.Item>
          <ListGroup.Item className="url"><span>{ url }</span></ListGroup.Item>
        </ListGroup>

        <p>
        <strong>IMPORTANT!</strong> First login to the <a id="live" href={awsExports.mediaLiveConsole} target="_blank" rel="noopener noreferrer">Medialive Console</a> and
         check the live channel is running.
        </p>

        <Button onClick={() => this.load(awsExports.hls_manifest,"HLS")} className="perview" size="sm" variant="success">Preview HLS</Button>
        <Button onClick={() => this.load(awsExports.dash_manifest,"DASH")} className="perview" size="sm" variant="success">Preview DASH</Button>
        <Button onClick={() => this.load(awsExports.cmaf_manifest,"CMAF")} className="perview" size="sm" variant="success">Preview CMAF</Button>
        
        <CardDeck style={{ margin: '4rem auto'}}>
          <Card>
            <Card.Header>Resources</Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item><a href="https://aws.amazon.com/answers/media-entertainment/live-streaming/" target="_blank" rel="noopener noreferrer">Solution Landing page</a></ListGroup.Item>
              <ListGroup.Item><a href="https://docs.aws.amazon.com/solutions/latest/live-streaming/welcome.html" target="_blank" rel="noopener noreferrer">Implementation Guide</a></ListGroup.Item>
              <ListGroup.Item><a href="https://github.com/awslabs/live-stream-on-aws" target="_blank" rel="noopener noreferrer">Source Code on AWS Labs</a></ListGroup.Item>
            </ListGroup>
          </Card>
          <Card>
            <Card.Header>Documentation</Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item><a href="https://aws.amazon.com/medialive/" target="_blank" rel="noopener noreferrer">AWS Elemental MediaLive</a></ListGroup.Item>
              <ListGroup.Item><a href="https://aws.amazon.com/mediapackage/" target="_blank" rel="noopener noreferrer">AWS Elemental MediaPackage</a></ListGroup.Item>
              <ListGroup.Item><a href="https://aws.amazon.com/cloudfront/" target="_blank" rel="noopener noreferrer">Amazon CloudFront</a></ListGroup.Item>
            </ListGroup>
          </Card>
        </CardDeck>

      </div>
    );
  }
}

export default App;
