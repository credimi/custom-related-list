/***
* @description Lightning controller for the App Builder to provide the list of
*              Record Profile configurations registered in the sfpegProfile__mdt custom
*              metadat and available on the current Object type, for use in a configuration
*              attribute data source (to display a picklist).
* @author      P-E GROS
* @date        August 2021
* @see PEG_LIST package (https://github.com/pegros/PEG_LIST)
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

@SuppressWarnings('PMD.ClassNamingConventions')
global with sharing class sfpegProfileSelector_CTL extends VisualEditor.DynamicPickList {

	/***
	* @description Context of the Lightning page calling the picklist controller.
	***/
	VisualEditor.DesignTimePageContext pageContext;

	/***
	* @description Constructor enabling to fetch the Lightning page context (and especially
	*              the entityName of the record being displayed in the page).
	* @param       VisualEditor.DesignTimePageContext   Current page context
	* @exception   none really specific.
	***/

	global sfpegProfileSelector_CTL(VisualEditor.DesignTimePageContext pageContext) {
		System.debug(LoggingLevel.FINEST,'Constructor START with sfpegProfile page context ' + pageContext);
		System.debug(LoggingLevel.FINEST,'Constructor entityName ' + pageContext.entityName);
		this.pageContext = pageContext;
	}


	/***
	* @description Override of the method providing the default value.
	* @return      VisualEditor.DataRow   Always returns the default ('---','N/A') value.
	* @exception   none really specific.
	***/
	global override VisualEditor.DataRow getDefaultValue() {
		System.debug(LoggingLevel.FINEST,'getDefaultValue START Number');
		return new VisualEditor.DataRow('---','N/A');
	}

	/***
	* @description Override of the method providing the set of picklist values.
	*              Returns label / names couples for all field sets
	*              defined on entity. Includes a default ('---','N/A') value.
	* @return      VisualEditor.DynamicPickListRows  List of field set names for datasource.
	* @exception   none really specific.
	***/
	global override VisualEditor.DynamicPickListRows getValues() {
		System.debug(LoggingLevel.FINEST,'getValues: START for sfpegProfile');

		VisualEditor.DynamicPickListRows picklistValues = new VisualEditor.DynamicPickListRows();
		picklistValues.addRow(new VisualEditor.DataRow('---','N/A'));
		System.debug(LoggingLevel.FINEST,'getValues: picklistValues init ' + picklistValues);

		System.debug(LoggingLevel.FINEST,'getValues: entity name fetched ' + pageContext.entityName);
		Map<ID,sfpegProfile__mdt> profiles = new Map<ID,sfpegProfile__mdt>();
		if (! String.isEmpty(pageContext.entityName)) {
			System.debug(LoggingLevel.FINEST,'getValues: fetching Record and object specific profiles');
			profiles.putAll(new Map<ID,sfpegProfile__mdt>(
				[   select MasterLabel,  DeveloperName
					from sfpegProfile__mdt
					where Scope__c LIKE '%RECORDS%']));
			String entityPattern = '%' + pageContext.entityName + '%';
			profiles.putAll(new Map<ID,sfpegProfile__mdt>(
				[   select MasterLabel,  DeveloperName
					from sfpegProfile__mdt
					where Scope__c LIKE :entityPattern]));
		}
		System.debug(LoggingLevel.FINEST,'getValues: profiles initialized ' + profiles);

		for (ID iter : profiles.keySet()){
			sfpegProfile__mdt profileIter = profiles.get(iter);
			System.debug(LoggingLevel.FINEST,'getValues: processing profile ' + profileIter);
			picklistValues.addRow(new VisualEditor.DataRow(
				profileIter.MasterLabel,
				profileIter.DeveloperName));
		}
		System.debug(LoggingLevel.FINEST,'getValues: picklistValues completed ' + picklistValues);
		System.debug(LoggingLevel.FINE,'getValues: END with #Items ' + picklistValues.size());
		return picklistValues;
	}
}