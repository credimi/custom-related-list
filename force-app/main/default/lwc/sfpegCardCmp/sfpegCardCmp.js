/***
* @author P-E GROS
* @date   Oct 2021
* @description  LWC Component to display a single record Card.
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
***//***
* @author P-E GROS
* @date   Oct 2021
* @description  LWC Component to display a Record Card, leveraging the LDS
*               (with a configurable list of fields) for display.
*               This record may be the current record of a page, a related 
*               one (via lookup chain) or a record provided by a
*               parent component.
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

import { LightningElement, wire , api, track} from 'lwc';
import getConfiguration from '@salesforce/apex/sfpegCard_CTL.getConfiguration';
import currentUserId    from '@salesforce/user/Id';
import { getRecord }    from 'lightning/uiRecordApi';
import SAVE_LABEL       from '@salesforce/label/c.sfpegCardSave';
import CANCEL_LABEL     from '@salesforce/label/c.sfpegCardCancel';

var CARD_CONFIGS = {};

export default class SfpegCardDsp extends LightningElement {

    //----------------------------------------------------------------
    // Main configuration fields (for App Builder)
    //----------------------------------------------------------------
    @api cardTitle;             // Title of the wrapping Card
    @api cardIcon;              // Icon of the wrapping Card
    @api cardClass;             // CSS Classes for the wrapping card div
    @api buttonSize = 'small';  // Size of the standard header buttons (to align with custom header actions)

    @api configName;            // DeveloperName for the sfpegCard__mdt record to be used
    @api actionConfigName;      // DeveloperName for the sfpegAction__mdt record to be used for header actions

    @api isReadOnly = false;    // Display card in readonly mode
    @api isCollapsible = false; // Collapsible mode activation
    @api isCollapsed = false;   // Collapsible mode state (initial state may be configured)

    @api isDebug = false;       // Debug mode activation
    @api isDebugFine = false;   // Debug mode activation for all subcomponents.

    //----------------------------------------------------------------
    // Other configuration fields (for component embedding)
    //----------------------------------------------------------------
    @api parentRecord;              // Parent record

    //Button Labels from custom labels
    cancelLabel = CANCEL_LABEL;
    saveLabel = SAVE_LABEL;

    //----------------------------------------------------------------
    // Internal Initialization Parameters
    //----------------------------------------------------------------
    @track isReady = false;         // Initialization state of the component (to control spinner)
    @track configDetails = null;    // Global configuration of the component
    @track isEditMode = false;      // Current Edit/Read mode
    @track errorMsg = null;         // Error message (if any for end user display)
    @track errorMsg;                // Possible error message displayed

    //----------------------------------------------------------------
    // Context Data
    //----------------------------------------------------------------
    @api objectApiName;         // Object API Name for current page record (if any)
    @api recordId;              // ID of current page record (if any)
    @track recordFields;        // Set of fields to fetch to get the actual form record data (if not current record) 

    @api formObjectApiName;     // Object API Name of the form record
    @api formRecordIdField;     // API Name of the field on the current record to be used to get the form record ID
    @api formRecordId;          // ID of the form record (derived from formRecordIdFieldName or recordId) or directly set (embedding case)
    @track formRecordTypeId;    // Record Type ID of the form record (required for Edit mode, fetched upon load)

    userId = currentUserId;     // ID of current User

    //----------------------------------------------------------------
    // Custom UI Display getters
    //----------------------------------------------------------------
    get showCardHeaderIcons() {
        return (this.cardIcon || this.isCollapsible);
    }
    get hasErrorMsg () {
        if (this.errorMsg) return true;
        return false;
    }
    get showContent () {
        if ((this.configDetails) && (!this.isCollapsed)) return true;
        return false;
    }
    get editIconName() {
        return this.isEditMode ? "utility:undo" : "utility:edit";
    }
    get editIconVariant() {
        return this.isEditMode ? "neutral" : "brand";
    }
    get debugTarget() {
        return (this.configDetails ? JSON.stringify(this.configDetails.target) : "...");
    }
    get debugFields() {
        return (this.configDetails ? JSON.stringify(this.configDetails.fields) : "...");
    }
    get debugSections() {
        return (this.configDetails ? JSON.stringify(this.configDetails.sections) : "...");
    }

    //----------------------------------------------------------------
    // Component initialisation  
    //----------------------------------------------------------------      
    connectedCallback() {
        if (this.isDebug) console.log('connected: START');
        if (this.isDebug) console.log('connected: recordId provided ',this.recordId);
        if (this.isDebug) console.log('connected: objectApiName provided ',this.objectApiName);
        if (this.isDebug) console.log('connected: userId provided ',this.userId);

        if (this.isReady) {
            console.warn('connected: END / already ready');
            return;
        }

        if ((!this.configName) || (this.configName === 'N/A')){
            console.warn('connected: END / missing configuration');
            this.errorMsg = 'Missing configuration!';
            this.isReady = true;
            return;
        }

        /*
        if (!this.formObjectApiName) {
            this.formObjectApiName = this.objectApiName
            if (this.isDebug) console.log('connected: formObjectApiName set to objectApiName ', this.formObjectApiName);
        }
        else {
            if (this.isDebug) console.log('connected: using provided formObjectApiName ', this.formObjectApiName);
        }
        if (!this.formRecordId) {
            if (!this.formRecordIdField) {
                this.formRecordId = this.recordId;
                if (this.isDebug) console.log('connected: formRecordId set to recordId ', this.formRecordId);
            }
            else {
                if (this.isDebug) console.log('connected: fetching form record ID from field');
                let idField = this.objectApiName + '.' + this.formRecordIdField;
                if (this.isDebug) console.log('connected: idField initialized ',idField);
                this.recordFields = [].push(idField);
                if (this.isDebug) console.log('connected: recordFields set ', this.recordFields);
            }
        }
        else {
            if (this.isDebug) console.log('connected: using provided formRecordId ', this.formRecordId);
        }
        */

        if (this.isDebug) console.log('connected: config name fetched ', this.configName);
        if (CARD_CONFIGS[this.configName]) {
            if (this.isDebug) console.log('connected: configuration already available');
            this.configDetails = CARD_CONFIGS[this.configName];

            this.initFormTarget();
            if (this.formRecordId) {
                if (this.isDebug) console.log('connected: END / no form record ID fetch required');
                this.isReady = true;
            }
            else {
                if (this.isDebug) console.log('connected: END / awaiting form record ID');
            }
        }
        else {
            if (this.isDebug) console.log('connected: fetching configuration from server');
            getConfiguration({name: this.configName})
            .then( result => {
                if (this.isDebug) console.log('connected: configuration received  ',result);
                try {
                    let config = JSON.parse(result.DisplayConfig__c);
                    if (this.isDebug) console.log('connected: config parsed ');

                    CARD_CONFIGS[this.configName] = {
                        label:      result.MasterLabel,
                        target: {
                            objectApiName: result.TargetObject__c,
                            recordIdField: result.TargetIdField__c
                        },
                        size:       config.size || 12,
                        fields:     config.fields || [],
                        sections:   config.sections || []
                    };
                    this.configDetails = CARD_CONFIGS[this.configName];
                    if (this.isDebug) console.log('connected: configuration registered ',JSON.stringify(this.configDetails));

                    ((this.configDetails).fields).forEach( iterField => {
                        iterField.size = ((iterField.size) || (this.configDetails.size));
                    });
                    if (this.isDebug) console.log('connected: fields reworked ',JSON.stringify(this.configDetails.fields));

                    ((this.configDetails).sections).forEach( iterSection => {
                        if (iterSection.fields) {
                            (iterSection.fields).forEach(iterField => {
                                iterField.size = iterField.size || iterSection.size || this.configDetails.size;
                            });
                        }
                        else {
                            console.warn('connected: section found with no fields ', JSON.stringify(iterSection));
                        }
                    });
                    if (this.isDebug) console.log('connected: sections reworked ', JSON.stringify(this.configDetails.sections) );
                    
                    this.initFormTarget();
                    if (this.formRecordId) {
                        if (this.isDebug) console.log('connected: END / no form record ID fetch required');
                        this.isReady = true;
                    }
                    else {
                        if (this.isDebug) console.log('connected: record ID ', this.recordId);
                        if (this.isDebug) console.log('connected: recordFields ', JSON.stringify(this.recordFields));
                        if (this.isDebug) console.log('connected: END / awaiting form record ID');
                    }
                }
                catch (parseError){
                    console.warn('connected: END / configuration parsing failed ',parseError);
                    this.errorMsg = 'Configuration parsing failed: ' + parseError;
                    this.isReady = true;
                }
            })
            .catch( error => {
                console.warn('connected: END / configuration fetch error ',error);
                this.errorMsg = 'Configuration fetch error: ' + error;
                this.isReady = true;
            });
            if (this.isDebug) console.log('connected: request sent');
        }
    }

    @wire(getRecord, { "recordId": '$recordId', "fields": '$recordFields' })
    wiredRecord({ error, data }) {
        if (this.isDebug) console.log('wiredRecord: START with ID ', this.recordId);
        if (this.isDebug) console.log('wiredRecord: recordFields fetched ',JSON.stringify(this.recordFields));

        if (data) {
            if (this.isDebug) console.log('wiredRecord: data fetch OK', JSON.stringify(data));

            if (this.formRecordId) {
                if (this.isDebug) console.log('wiredRecord: END / formRecordId already set', this.formRecordId);
            }
            else {
                if (this.isDebug) console.log('wiredRecord: data fields ', JSON.stringify((data.fields)));
                if (this.isDebug) console.log('wiredRecord: ID Field ', this.configDetails.target.recordIdField);
                this.formRecordId = ((data.fields)[this.configDetails.target.recordIdField]).value;
                //this.formRecordId = this.recordId;
                if (this.isDebug) console.log('wiredRecord: END / formRecordId set ', this.formRecordId);
            } 
            this.isReady = true;
        }
        else if (error) {
            console.warn('wiredRecord: data fetch KO', JSON.stringify(error));
            this.errorMsg = JSON.stringify(error);
            this.isReady = true;
        }
        else {
            if (this.isDebug) console.log('wiredRecord: END N/A');
        }
    }

    initFormTarget() {
        if (this.isDebug) console.log('initFormTarget: START');

        if (this.isDebug) console.log('initFormTarget: target configured ', JSON.stringify(this.configDetails.target));

        this.formObjectApiName = this.configDetails.target.objectApiName || this.objectApiName;
        if (this.isDebug) console.log('initFormTarget: formObjectApiName init ', this.formObjectApiName);


        if (!this.configDetails.target.recordIdField) {
            this.formRecordId = this.recordId;
            if (this.isDebug) console.log('initFormTarget: formRecordId set to recordId ', this.formRecordId);
        }
        else {
            if (this.isDebug) console.log('initFormTarget: fetching form record ID from field');
            let idField = this.objectApiName + '.' + this.configDetails.target.recordIdField;
            if (this.isDebug) console.log('initFormTarget: idField initialized ',idField);
            this.recordFields = [idField];
            if (this.isDebug) console.log('initFormTarget: recordFields set ', JSON.stringify(this.recordFields));
        }

        if (this.isDebug) console.log('initFormTarget: END');
    }

    //----------------------------------------------------------------
    // Event Handlers  
    //---------------------------------------------------------------- 
    // Expand / Collapse management
    handleExpandCollapse(event) {
        if (this.isDebug) console.log('handleExpandCollapse: START with isCollapsed ',this.isCollapsed);
        this.isCollapsed = !this.isCollapsed;
        if (this.isDebug) console.log('handleExpandCollapse: END with toggled isCollapsed ',this.isCollapsed);
    }

    // Read / Edit management
    handleModeToggle(event) {
        if (this.isDebug) console.log('handleModeToggle: START with isEditMode ',this.isEditMode);
        this.isEditMode = !this.isEditMode;
        if (this.isEditMode) {
            this.isCollapsed = false;
            if (this.isDebug) console.log('handleModeToggle: enforcing uncollapsed mode ',this.isCollapsed);
        }
        if (this.isDebug) console.log('handleModeToggle: END with toggled isEditMode ',this.isEditMode);
    }
    
    // Edit Form management
    handleFormLoad(event) {
        if (this.isDebug) console.log('handleFormLoad: START ');
        if (this.isDebug) console.log('handleFormLoad: event received  ',event);
        if (this.isDebug) console.log('handleFormLoad: event detail received  ',JSON.stringify(event.detail));

        if (!this.formRecordTypeId) {
            let rtID = (event.detail.records)[this.formRecordId].recordTypeId;
            if (rtID) {
                this.formRecordTypeId = rtID;
                if (this.isDebug) console.log('handleFormLoad: record type ID set ',this.formRecordTypeId);
            }
            else {
                if (this.isDebug) console.log('handleFormLoad: no recordType on current record');
            }
        }
        else {
            if (this.isDebug) console.log('handleFormLoad: record type ID already set ',this.formRecordTypeId);
        }
        
        if (this.isDebug) console.log('handleFormLoad: END',this.isEditMode);
    }

    handleFormSuccess(event) {
        if (this.isDebug) console.log('handleFormSuccess: START ');
        this.isEditMode = false;
        if (this.isDebug) console.log('handleFormSuccess: END / edit mode reset to ',this.isEditMode);
    }
    
}