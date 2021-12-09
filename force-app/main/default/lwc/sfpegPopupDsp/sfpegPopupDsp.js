/***
* @author P-E GROS
* @date   May 2021
* @description  LWC Component to display User interaction Popups
*
* Legal Notice
* 
* MIT License
* 
* Copyright (c) 2021 pegros
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
***/

import { LightningElement, api, track } from 'lwc';

import CONFIRM_LABEL    from '@salesforce/label/c.sfpegPopupConfirm';
import SAVE_LABEL       from '@salesforce/label/c.sfpegPopupSave';
import SAVE_NEW_LABEL   from '@salesforce/label/c.sfpegPopupSaveNew';
import CANCEL_LABEL     from '@salesforce/label/c.sfpegPopupCancel';

export default class SfpegPopupDsp extends LightningElement {

    // Configuration parameters
    @api isDebug = false;

    // Internal parameters
    @track showPopup = false;           // Main flag controlling the display of the popup
    @track popupTitle = '';             // Popup display title
    @track popupMessage = '';           // Popup display message
    
    // Spinner & Confirmation mode parameters
    @track showSpinner = false;         // Flag controlling the display of the popup spinner
    @track showConfirmation = false;    // Flag to toggle confirmation mode display
   
    // Record Form Display parameters
    @track showForm = false;            // Flag to toggle Record Form mode display
    //@track showSaveNew = false;         // Flag to display a save & new button in creation mode
    doSubmit = false;                   // Flag to let the popup execute the form submit (record creation/modification)
    @track formRecord = {};             // Record data for the Form
    @track formFieldSize = 12;          // Width of a form field (as a subset of 12 columns)
    @track formFields = [];             // Main list of fields displayed in the form
    @track formHiddenFields = [];       // List of fields included but hidden in the form (to enforce field values)
    
    // Promise handling
    _resolve = null;
    _reject =  null;

    //Button Labels from custom labels
    confirmLabel = CONFIRM_LABEL;
    saveLabel = SAVE_LABEL;
    saveNewLabel = SAVE_NEW_LABEL;
    cancelLabel = CANCEL_LABEL;

    //Custom getters
    get showClose() {
        return this.showConfirmation;
    }
    get showFooter() {
        return this.showConfirmation || this.showForm;
    }

    //###########################################################
    // Synchronous spinner popup display
    //###########################################################
    @api startSpinner(title,message) {
        if (this.isDebug) console.log('startSpinner: START');
        this.showPopup = true;
        this.showSpinner = true;
        this.popupTitle = title;
        this.popupMessage = message;
        this._resolve = null;
        this._reject =  null;
        if (this.isDebug) console.log('startSpinner: END');
    }

    @api stopSpinner(title) {
        if (this.isDebug) console.log('stopSpinner: START');
        this.resetCmp();
        if (this.isDebug) console.log('stopSpinner: END');
    }

    

    //###########################################################
    // Asynchronous Confimation popup display
    //###########################################################
    @api showConfirm(title,message) {
        if (this.isDebug) console.log('showConfirm: START with ',title);
        if (this.isDebug) console.log('showConfirm: message provided ',message);
        this.showPopup = true;
        this.showConfirmation = true;
        this.popupTitle = title;
        this.popupMessage = message;
        if (this.isDebug) console.log('showConfirm: END');
        return new Promise(
            (resolve,reject) => {
            if (this.isDebug) console.log('showConfirm: promise START');
            this._resolve = resolve;
            this._reject = reject;
            if (this.isDebug) console.log('showConfirm: promise END');
        });
    }

    handleClose(event){
        if (this.isDebug) console.log('handleClose: START');
        if (this._reject) {
            if (this.isDebug) console.log('handleClose: END - calling promise handler');
            this._reject({noToast: true, message:'Popup closed by user'});
        }
        else {
            if (this.isDebug) console.log('handleClose: END - no reject handler available');
        }
        this.resetCmp();
    }

    handleCancel(event){
        if (this.isDebug) console.log('handleCancel: START');
        if (this._reject) {
            if (this.isDebug) console.log('handleCancel: END - calling promise handler');
            this._reject({noToast: true, message:'Action cancelled by user'});
        }
        else {
            console.warn('handleCancel: END - no reject handler available');
        }
        this.resetCmp();
    }

    handleConfirm(event){
        if (this.isDebug) console.log('handleConfirm: START');
        if (this._resolve) {
            if (this.isDebug) console.log('handleConfirm: END - calling promise handler');
            this._resolve();
        }
        else {
            if (this._reject) { 
                console.warn('handleConfirm: END - no promise resolve handler available');
                this._reject({message:'Missing promise resolve handler'});
            }
            else {
                console.warn('handleConfirm: END - no promise resolve nor reject handlers available');
            }
        }
        this.resetCmp();
    }

    //###########################################################
    // Asynchronous Edit / Create popup display (depends on presence of ID on record)
    //###########################################################
    @api showRecordForm(title,message,record,fields,columns,doSubmit,showSaveNew) {
        if (this.isDebug) console.log('showRecordForm: START with submit? ',doSubmit);
        this.showPopup = true;
        this.doSubmit = doSubmit;

        if (this.isDebug) console.log('showRecordForm: record provided ',JSON.stringify(record));
        if (record.Id) {
            if (this.isDebug) console.log('showRecordForm: edition mode');
            this.showSpinner = true;
            //this.showSaveNew = false;
        }
        else {
            if (this.isDebug) console.log('showRecordForm: creation mode');
            //this.showSaveNew = doSubmit && showSaveNew;
            //if (this.isDebug) console.log('showRecordForm: showSaveNew set ',showSaveNew);
        }
        this.showConfirmation = false;
        this.showForm = true;
        if (this.isDebug) console.log('showRecordForm: show updated');

        this.popupTitle = title;
        this.popupMessage = message;
        if (this.isDebug) console.log('showRecordForm: title & message set');

        if (this.isDebug) console.log('showRecordForm: Record ID provided ',record.Id);
        if (this.isDebug) console.log('showRecordForm: RecordType ID provided ', record.RecordTypeId);
        if (this.isDebug) console.log('showRecordForm: Object API Name provided ', record.ObjectApiName);

        this.formFieldSize = (columns ? 12/columns : 12);
        if (this.isDebug) console.log('showRecordForm: columns provided ', columns);
        if (this.isDebug) console.log('showRecordForm: formFieldSize init ',this.formFieldSize);
        this.formRecord = record;
        if (this.isDebug) console.log('showRecordForm: formRecord init ',JSON.stringify(this.formRecord));
        this.formFields = [];
        this.formHiddenFields = [];
        if (this.isDebug) console.log('showRecordForm: fields provided ',JSON.stringify(fields));
        fields.forEach(iterField => {
            let fieldDesc = {
                name : iterField.name,
            };
            if (record[iterField.name]) fieldDesc.value = record[iterField.name];
            if (iterField.hidden) {
                if (this.isDebug) console.log('showRecordForm: hiding field ',JSON.stringify(iterField));
                this.formHiddenFields.push(fieldDesc);
            }
            else {
                if (this.isDebug) console.log('showRecordForm: showing field ',JSON.stringify(iterField));
                if (iterField.disabled) fieldDesc.disabled = iterField.disabled;
                if (iterField.required) fieldDesc.required = iterField.required;
                this.formFields.push(fieldDesc);
            }
            if (this.isDebug) console.log('showRecordForm: fieldDesc init ',JSON.stringify(fieldDesc));
        });
        if (this.isDebug) console.log('showRecordForm: formFields init ',JSON.stringify(this.formFields));
        if (this.isDebug) console.log('showRecordForm: formHiddenFields init ',JSON.stringify(this.formHiddenFields));

        if (this.isDebug) console.log('showRecordForm: END');
        return  new Promise((resolve,reject)=> {
            if (this.isDebug) console.log('showRecordForm: promise init START');
            this._resolve = resolve;
            this._reject = reject;
            if (this.isDebug) console.log('showRecordForm: promise init END');
        });
    }

    handleLoad(event){
        if (this.isDebug) console.log('handleLoad: START',event);
        if (this.isDebug) console.log('handleLoad: load details ', JSON.stringify(event.detail));
        this.showSpinner = false;
    }

    handleSubmit(event){
        if (this.isDebug) console.log('handleSubmit: START');
        if (this.isDebug) console.log('handleSubmit: event ', event);
        if (this.isDebug) console.log('handleSubmit: submit details ', JSON.stringify(event.detail));

        if (this.checkRequiredFieldsFilled()) {
            if (this.isDebug) console.log('handleSubmit: all required field set ');
            if (this.doSubmit) {
                if (this.isDebug) console.log('handleSubmit: submitting form');
                this.showSpinner = true;
                let editForm = this.template.querySelector('lightning-record-edit-form');
                editForm.submit();
                if (this.isDebug) console.log('handleSubmit: END / form submitted');
            }
            else {
                if (this.isDebug) console.log('handleSubmit: preventing submit and returning only input data');
            
                try {
                    let newRecord = this.initNewRecord();
                    if (this.isDebug) console.log('handleSubmit: newRecord daat fetched ', JSON.stringify(newRecord));
            
                    if (this._resolve) {
                        if (this.isDebug) console.log('handleSubmit: END - calling promise handler');
                        this._resolve(newRecord);
                        this.resetCmp();
                    }
                    else {
                        if (this._reject) { 
                            console.warn('handleSubmit: END - no promise resolve handler available');
                            this._reject('Missing promise resolve handler');
                        }
                        else {
                            console.warn('handleSubmit: END - no promise resolve nor reject handler available');
                        }
                        this.resetCmp();
                    }
                }
                catch(error) {
                    console.warn('handleSubmit: END - Submission error ',error);
                }
            } 
        }
        else {
            if (this.isDebug) console.log('handleSubmit: END / KO Missing required field(s)');
        }
    }

    handleError(event){
        if (this.isDebug) console.log('handleError: START',event);
        if (this.isDebug) console.log('handleError: error details ', JSON.stringify(event.detail));
        this.showSpinner = false;
    }

    handleSave(event){
        if (this.isDebug) console.log('handleSave: START',event);
        if (this.isDebug) console.log('handleSave: save details ', JSON.stringify(event.detail));
        if (this.isDebug) console.log('handleSave: formRecord ', JSON.stringify(this.formRecord));

        try {
            let newRecord = this.initNewRecord();
            if (!newRecord.Id) newRecord.Id = event.detail.id;
            if (this.isDebug) console.log('handleSave: newRecord init ', JSON.stringify(newRecord));

            if (this._resolve) {
                if (this.isDebug) console.log('handleSave: calling promise handler');
                // waiting for refresh / propagation of LDS cache if there is a next action
                this.showSpinner = true;
                setTimeout(() => {
                    this._resolve();
                    if (this.isDebug) console.log('handleSave: promise handler called');
                    this.resetCmp();
                    if (this.isDebug) console.log('handleSave: END / component reset');
                },2000);
                if (this.isDebug) console.log('handleSave: waiting');
            }
            else {
                if (this._reject) { 
                    console.warn('handleSave: END - no promise resolve handler available');
                    this._reject('Missing promise resolve handler');
                }
                else {
                    console.warn('handleSave: END - no promise resolve nor reject handler available');
                }
                this.resetCmp();
            }
        }
        catch (error) {
            console.warn('handleSave: error raised whil saving ', JSON.stringify(error));
            this.showSpinner = false;
        }
    }

    /*handleSaveNew(event) {
        if (this.isDebug) console.log('handleSaveNew: START',event);


        if (this.isDebug) console.log('handleSaveNew: END');
    }*/


    //###########################################################
    // Utilities
    //###########################################################  
    initNewRecord = function() {
        if (this.isDebug) console.log('initNewRecord: START ');

        let newRecord = {...(this.formRecord)};
        if (this.isDebug) console.log('initNewRecord: newRecord init ', JSON.stringify(newRecord));

        let inputFields = this.template.querySelectorAll('lightning-input-field');
        if (this.isDebug) console.log('initNewRecord: inputFields fetched ', inputFields);
        if (inputFields) {
            inputFields.forEach(fieldIter => {
                if (this.isDebug) console.log('initNewRecord: processing fieldName ', fieldIter.fieldName);
                if (this.isDebug) console.log('initNewRecord: with value  ', fieldIter.value);
                if (this.isDebug) console.log('initNewRecord: required?  ', fieldIter.required);
                if (this.isDebug) console.log('initNewRecord: valid?  ', fieldIter);
                if ((fieldIter.required) && (fieldIter.value == null)) {
                    console.warn('initNewRecord: missing required field  ', fieldIter.fieldName);
                    fieldIter.setErrors({'errors':[{'message':'Field is required!'}]});
                    throw (fieldIter.fieldName + ' required field not filled!');
                }
                newRecord[fieldIter.fieldName] = fieldIter.value;
            });
        }
        if (this.isDebug) console.log('initNewRecord: END with newRecord ', JSON.stringify(newRecord));
        return newRecord;
    }

    checkRequiredFieldsFilled = function() {
        if (this.isDebug) console.log('checkRequiredFieldsFilled: START ');

        let inputFields = this.template.querySelectorAll('lightning-input-field');
        if (this.isDebug) console.log('checkRequiredFieldsFilled: inputFields fetched ', JSON.stringify(inputFields));

        let isOK = true;
        if (inputFields) {
            inputFields.forEach(fieldIter => {
                if (this.isDebug) console.log('checkRequiredFieldsFilled: processing fieldName ', fieldIter.fieldName);
                if (this.isDebug) console.log('checkRequiredFieldsFilled: with value  ', fieldIter.value);
                if (this.isDebug) console.log('checkRequiredFieldsFilled: required?  ', fieldIter.required);
                //if (this.isDebug) console.log('checkRequiredFieldsFilled: valid?  ', fieldIter);
                if (this.isDebug) console.log('checkRequiredFieldsFilled: null value ?  ', (fieldIter.value == null) );
                if (this.isDebug) console.log('checkRequiredFieldsFilled: empty value ?  ', (fieldIter.value === ''));
                if ((fieldIter.required) && ((fieldIter.value == null) || (fieldIter.value === ''))) {
                    // handle value removal of required input field & boolean inputs
                    // Boolean fields appear always as required !
                    console.warn('checkRequiredFieldsFilled: missing required field  ', fieldIter.fieldName);
                    isOK = false;
                    fieldIter.setErrors({'errors':[{'message':'Field is required!'}]});
                }
            });
        }
        if (this.isDebug) console.log('checkRequiredFieldsFilled: END with isOK ', isOK);
        return isOK;
    }

    resetCmp = function() {
        if (this.isDebug) console.log('resetCmp: START ');
        this.showPopup = false;
        this.showSpinner = false;
        this.showConfirmation = false;
        this.showForm = false;
        this.doSubmit = false;
        this.popupTitle = '';
        this.popupMessage = '';
        this.editFieldSize = 12;
        //this.showSaveNew = false;
        this._reject = null;
        this._resolve = null;
        if (this.isDebug) console.log('resetCmp: END ');
    }

}