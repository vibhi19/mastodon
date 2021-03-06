import React from 'react';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import { fetchAccount } from 'flavours/glitch/actions/accounts';
import { expandAccountMediaTimeline } from 'flavours/glitch/actions/timelines';
import LoadingIndicator from 'flavours/glitch/components/loading_indicator';
import Column from 'flavours/glitch/features/ui/components/column';
import ProfileColumnHeader from 'flavours/glitch/features/account/components/profile_column_header';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { getAccountGallery } from 'flavours/glitch/selectors';
import MediaItem from './components/media_item';
import HeaderContainer from 'flavours/glitch/features/account_timeline/containers/header_container';
import { ScrollContainer } from 'react-router-scroll-4';
import LoadMore from 'flavours/glitch/components/load_more';
import MissingIndicator from 'flavours/glitch/components/missing_indicator';

const mapStateToProps = (state, props) => ({
  isAccount: !!state.getIn(['accounts', props.params.accountId]),
  medias: getAccountGallery(state, props.params.accountId),
  isLoading: state.getIn(['timelines', `account:${props.params.accountId}:media`, 'isLoading']),
  hasMore:   state.getIn(['timelines', `account:${props.params.accountId}:media`, 'hasMore']),
});

class LoadMoreMedia extends ImmutablePureComponent {

  static propTypes = {
    maxId: PropTypes.string,
    onLoadMore: PropTypes.func.isRequired,
  };

  handleLoadMore = () => {
    this.props.onLoadMore(this.props.maxId);
  }

  render () {
    return (
      <LoadMore
        disabled={this.props.disabled}
        onClick={this.handleLoadMore}
      />
    );
  }

}

@connect(mapStateToProps)
export default class AccountGallery extends ImmutablePureComponent {

  static propTypes = {
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    medias: ImmutablePropTypes.list.isRequired,
    isLoading: PropTypes.bool,
    hasMore: PropTypes.bool,
    isAccount: PropTypes.bool,
  };

  componentDidMount () {
    this.props.dispatch(fetchAccount(this.props.params.accountId));
    this.props.dispatch(expandAccountMediaTimeline(this.props.params.accountId));
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.params.accountId !== this.props.params.accountId && nextProps.params.accountId) {
      this.props.dispatch(fetchAccount(nextProps.params.accountId));
      this.props.dispatch(expandAccountMediaTimeline(this.props.params.accountId));
    }
  }

  handleHeaderClick = () => {
    this.column.scrollTop();
  }

  handleScrollToBottom = () => {
    if (this.props.hasMore) {
      this.handleLoadMore(this.props.medias.size > 0 ? this.props.medias.last().getIn(['status', 'id']) : undefined);
    }
  }

  handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const offset = scrollHeight - scrollTop - clientHeight;

    if (150 > offset && !this.props.isLoading) {
      this.handleScrollToBottom();
    }
  }

  handleLoadMore = maxId => {
    this.props.dispatch(expandAccountMediaTimeline(this.props.params.accountId, { maxId }));
  };

  handleLoadOlder = (e) => {
    e.preventDefault();
    this.handleScrollToBottom();
  }

  shouldUpdateScroll = (prevRouterProps, { location }) => {
    if ((((prevRouterProps || {}).location || {}).state || {}).mastodonModalOpen) return false;
    return !(location.state && location.state.mastodonModalOpen);
  }

  setRef = c => {
    this.column = c;
  }

  render () {
    const { medias, isLoading, hasMore, isAccount } = this.props;

    if (!isAccount) {
      return (
        <Column>
          <MissingIndicator />
        </Column>
      );
    }

    let loadOlder = null;

    if (!medias && isLoading) {
      return (
        <Column>
          <LoadingIndicator />
        </Column>
      );
    }

    if (hasMore && !(isLoading && medias.size === 0)) {
      loadOlder = <LoadMore visible={!isLoading} onClick={this.handleLoadOlder} />;
    }

    return (
      <Column ref={this.setRef}>
        <ProfileColumnHeader onClick={this.handleHeaderClick} />

        <ScrollContainer scrollKey='account_gallery' shouldUpdateScroll={this.shouldUpdateScroll}>
          <div className='scrollable scrollable--flex' onScroll={this.handleScroll}>
            <HeaderContainer accountId={this.props.params.accountId} />

            <div role='feed' className='account-gallery__container'>
              {medias.map((media, index) => media === null ? (
                <LoadMoreMedia
                  key={'more:' + medias.getIn(index + 1, 'id')}
                  maxId={index > 0 ? medias.getIn(index - 1, 'id') : null}
                  onLoadMore={this.handleLoadMore}
                />
              ) : (
                <MediaItem
                  key={media.get('id')}
                  media={media}
                />
              ))}
              {loadOlder}
            </div>

            {isLoading && medias.size === 0 && (
              <div className='scrollable__append'>
                <LoadingIndicator />
              </div>
            )}
          </div>
        </ScrollContainer>
      </Column>
    );
  }

}
