/*******************************************************************************
 * eGov suite of products aim to improve the internal efficiency,transparency, 
 *    accountability and the service delivery of the government  organizations.
 * 
 *     Copyright (C) <2015>  eGovernments Foundation
 * 
 *     The updated version of eGov suite of products as by eGovernments Foundation 
 *     is available at http://www.egovernments.org
 * 
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     any later version.
 * 
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 * 
 *     You should have received a copy of the GNU General Public License
 *     along with this program. If not, see http://www.gnu.org/licenses/ or 
 *     http://www.gnu.org/licenses/gpl.html .
 * 
 *     In addition to the terms of the GPL license to be adhered to in using this
 *     program, the following additional terms are to be complied with:
 * 
 * 	1) All versions of this program, verbatim or modified must carry this 
 * 	   Legal Notice.
 * 
 * 	2) Any misrepresentation of the origin of the material is prohibited. It 
 * 	   is required that all modified versions of this material be marked in 
 * 	   reasonable ways as different from the original version.
 * 
 * 	3) This license does not grant any rights to any user of the program 
 * 	   with regards to rights under trademark law for use of the trade names 
 * 	   or trademarks of eGovernments Foundation.
 * 
 *   In case of any queries, you can reach eGovernments Foundation at contact@egovernments.org.
 ******************************************************************************/
package org.egov.web.actions.payment;

import java.text.ParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import org.apache.struts2.convention.annotation.Action;
import org.egov.commons.Bankaccount;
import org.egov.commons.CVoucherHeader;
import org.egov.commons.Functionary;
import org.egov.commons.Fund;
import org.egov.commons.Fundsource;
import org.egov.commons.Scheme;
import org.egov.commons.SubScheme;
import org.egov.commons.Vouchermis;
import org.egov.egf.commons.EgovCommon;
import org.egov.egf.commons.VoucherSearchUtil;
import org.egov.infra.admin.master.entity.AppConfigValues;
import org.egov.infra.admin.master.entity.Boundary;
import org.egov.infra.admin.master.entity.Department;
import org.egov.infra.admin.master.service.AppConfigValueService;
import org.egov.infra.exception.ApplicationException;
import org.egov.infra.validation.exception.ValidationError;
import org.egov.infra.validation.exception.ValidationException;
import org.egov.model.payment.Paymentheader;
import org.egov.web.actions.voucher.BaseVoucherAction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
@Transactional(readOnly=true)
public class PaymentReversalAction extends BaseVoucherAction{
	private VoucherSearchUtil voucherSearchUtil;
	private Date fromDate;
	private Date toDate;
	private List<CVoucherHeader> voucherHeaderList = new ArrayList<CVoucherHeader>();
	private boolean close = false;
	private String message = "";
	private EgovCommon egovCommon;
	Bankaccount bankAccount;
	private List<Paymentheader> paymentHeaderList = new ArrayList<Paymentheader>();
	private Paymentheader paymentHeader = new Paymentheader();
	private @Autowired AppConfigValueService appConfigValuesService;	

	@Override
	public void prepare() {
		super.prepare();
		List<AppConfigValues> appList = appConfigValuesService.getConfigValuesByModuleAndKey("finance","statusexcludeReport");
		String statusExclude = appList.get(0).getValue();
		if("".equalsIgnoreCase(statusExclude) || statusExclude == null)
			throw new ValidationException(Arrays.asList(new ValidationError("voucher.excludestatus.not.set", "voucher.excludestatus.not.set")));
		addDropdownData("bankList", egovCommon.getBankBranchForActiveBanks());
		addDropdownData("accNumList", Collections.EMPTY_LIST);
		addDropdownData("voucherNameList", persistenceService.findAllBy("select distinct vh.name from CVoucherHeader vh where vh.type='Payment' and status not in ("+statusExclude+") order by vh.name"));
	}

	public PaymentReversalAction(){
		voucherHeader.setVouchermis(new Vouchermis());
		addRelatedEntity("vouchermis.departmentid", Department.class);
		addRelatedEntity("fundId", Fund.class);
		addRelatedEntity("vouchermis.schemeid", Scheme.class);
		addRelatedEntity("vouchermis.subschemeid", SubScheme.class);
		addRelatedEntity("vouchermis.functionary", Functionary.class);
		addRelatedEntity("fundsourceId", Fundsource.class);
		addRelatedEntity("vouchermis.divisionid", Boundary.class);
	}
	
	public String reverse(){
		if(paymentHeader.getId() != null){
			paymentHeader = (Paymentheader) persistenceService.find("from Paymentheader where id=?", paymentHeader.getId());
			voucherHeader = paymentHeader.getVoucherheader();
		}
		return "reverse";
	}
	public String saveReverse(){
		if(voucherHeader.getId() != null)
			voucherHeader = (CVoucherHeader) persistenceService.find("from CVoucherHeader where id=?", voucherHeader.getId());
		saveReverse(voucherHeader.getName(), "Receipt");
		message = getText("transaction.success") + voucherHeader.getVoucherNumber();
		return "reverse";
	}
	
	public String saveReverseAndClose(){
		close = true;
		return saveReverse();
	}
@Action(value="/payment/paymentReversal-vouchersForReversal")
	public String vouchersForReversal(){
		return "reversalVouchers";
	}
	public String searchVouchersForReversal() throws ApplicationException, ParseException{
		voucherHeader.setType("Payment");
		voucherHeaderList = voucherSearchUtil.search(voucherHeader, getFromDate(), getToDate(), "reverse");
		String query = formQuery(voucherHeaderList);
		if(voucherHeaderList != null && voucherHeaderList.size()>0){
			if(bankAccount != null && bankAccount.getId()!=null)
				paymentHeaderList = (List<Paymentheader>) persistenceService.findAllBy(query+" and bankaccount.id=?",bankAccount.getId());
			else
				paymentHeaderList = (List<Paymentheader>) persistenceService.findAllBy(query);
		}
		if(paymentHeaderList.size() == 0)
			message = getText("no.records");
		return "reversalVouchers";
	}
	
	private String formQuery(List<CVoucherHeader> voucherHeaderList) {
		StringBuffer query = new StringBuffer("from Paymentheader where voucherheader.id in (");
		for (CVoucherHeader voucherHeader : voucherHeaderList) {
			query = query.append(voucherHeader.getId()).append(",");
		}
		if(voucherHeaderList.size()>0)
			return query.substring(0, query.length()-1).concat(" ) ");
		return query.toString().concat(" ) ");
	}

	public void setVoucherSearchUtil(VoucherSearchUtil voucherSearchUtil) {
		this.voucherSearchUtil = voucherSearchUtil;
	}
	public void setFromDate(Date fromDate) {
		this.fromDate = fromDate;
	}
	public Date getFromDate() {
		return fromDate;
	}
	public void setToDate(Date toDate) {
		this.toDate = toDate;
	}
	public Date getToDate() {
		return toDate;
	}
	public boolean isFieldMandatory(String field){
		return mandatoryFields.contains(field);
	}
	public boolean shouldShowHeaderField(String field){
		return  headerFields.contains(field);
	}

	public List<CVoucherHeader> getVoucherHeaderList() {
		return voucherHeaderList;
	}

	public void setClose(boolean close) {
		this.close = close;
	}

	public boolean isClose() {
		return close;
	}

	public String getMessage() {
		return message;
	}

	public void setEgovCommon(EgovCommon egovCommon) {
		this.egovCommon = egovCommon;
	}

	public List<Paymentheader> getPaymentHeaderList() {
		return paymentHeaderList;
	}

	public Paymentheader getPaymentHeader() {
		return paymentHeader;
	}

	@Override
	public CVoucherHeader getVoucherHeader() {
		return super.getVoucherHeader();
	}
}
