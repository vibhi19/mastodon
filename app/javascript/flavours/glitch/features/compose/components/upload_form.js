import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import UploadProgressContainer from '../containers/upload_progress_container';
import ImmutablePureComponent from 'react-immutable-pure-component';
import UploadContainer from '../containers/upload_container';

export default class UploadForm extends ImmutablePureComponent {
  static propTypes = {
    mediaIds: ImmutablePropTypes.list.isRequired,
  };

  render () {
    const { mediaIds } = this.props;

    return (
      <div className='composer--upload_form'>
        <UploadProgressContainer />

        <div className='content'>
          {mediaIds.map(id => (
            <UploadContainer id={id} key={id} />
          ))}
        </div>
      </div>
    );
  }

}
