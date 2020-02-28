import { CircularProgress } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { UtsCenter } from '../../../components/UtsCenter';
import { BrowserStorage } from '../../../services/BrowserStorage';
import { Errors } from '../../../services/Errors';
import { Events } from '../../../services/Events';
import { OptionsActions } from '../components/options/OptionsActions';
import { OptionsList } from '../components/options/OptionsList';

function OptionsPage() {
  const [content, setContent] = useState({
    isLoading: true,
    options: {},
  });

  /**
   * @returns {Promise}
   */
  async function resetOptions() {
    setContent({
      isLoading: false,
      options: await BrowserStorage.getOptions(),
    });
  }

  useEffect(() => {
    function startListeners() {
      Events.subscribe(Events.OPTIONS_CLEAR, resetOptions);
      Events.subscribe(Events.OPTIONS_CHANGE, onOptionChange);
    }

    function stopListeners() {
      Events.unsubscribe(Events.OPTIONS_CLEAR, resetOptions);
      Events.unsubscribe(Events.OPTIONS_CHANGE, onOptionChange);
    }

    /**
     * @param {OptionEventData} data
     */
    function onOptionChange(data) {
      const optionsToSave = {};
      const options = {
        ...content.options,
        [data.id]: {
          ...content.options[data.id],
          value: data.checked,
        },
      };
      for (const option of Object.values(options)) {
        optionsToSave[option.id] = option.value;
      }
      const option = options[data.id];
      if (option.permissions || option.origins) {
        if (option.value) {
          browser.permissions.request({
            permissions: option.permissions || [],
            origins: option.origins || [],
          });
        } else {
          browser.permissions.remove({
            permissions: option.permissions || [],
            origins: option.origins || [],
          });
        }
      }
      BrowserStorage.set({ options: optionsToSave }, true)
        .then(async () => {
          setContent({
            isLoading: false,
            options,
          });
          await Events.dispatch(Events.SNACKBAR_SHOW, {
            messageName: 'saveOptionSuccess',
            severity: 'success',
          });
        })
        .catch(async err => {
          Errors.error('Failed to save option.', err);
          await Events.dispatch(Events.SNACKBAR_SHOW, {
            messageName: 'saveOptionFailed',
            severity: 'error',
          });
        });
    }

    startListeners();
    return stopListeners;
  }, [content]);

  useEffect(() => {
    resetOptions();
  }, []);

  return content.isLoading ? (
    <UtsCenter>
      <CircularProgress/>
    </UtsCenter>
  ) : (
    <>
      <OptionsList options={Object.values(content.options)}/>
      <OptionsActions/>
    </>
  );
}

export { OptionsPage };