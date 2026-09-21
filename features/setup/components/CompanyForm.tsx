"use client";

import { FormEvent, useState } from "react";
import { COMPANY_SIZES, COUNTRIES, INDUSTRIES } from "@/features/auth/catalog";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { authApi } from "@/features/auth/services/authApi";
import { countryLabel, industryLabel, sizeLabel, useI18n } from "@/features/i18n";

export function CompanyForm() {
  const { t, locale } = useI18n();
  const { session, updateSession } = useAuth();
  const business = session.business;
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(business.name);
  const [legalName, setLegalName] = useState(business.legalName ?? "");
  const [activity, setActivity] = useState(business.activity);
  const [industry, setIndustry] = useState(business.industry);
  const [country, setCountry] = useState(business.country);
  const [companySize, setCompanySize] = useState(business.companySize ?? "");
  const [website, setWebsite] = useState(business.website ?? "");
  const [city, setCity] = useState(business.city ?? "");
  const [phone, setPhone] = useState(business.phone ?? "");
  const [description, setDescription] = useState(business.description ?? "");
  const [logoUrl, setLogoUrl] = useState(business.logoUrl ?? "");

  const onLogo = (file: File | undefined) => {
    setError(null);
    setSaved(false);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("companyForm.logoImage"));
      return;
    }
    if (file.size > 280_000) {
      setError(t("companyForm.logoSize"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setLogoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const next = await authApi.updateBusiness(session.token, {
        name,
        legalName: legalName || null,
        activity,
        industry,
        country,
        companySize: companySize || null,
        website: website || null,
        city: city || null,
        phone: phone || null,
        description: description || null,
        logoUrl: logoUrl || null,
      });
      updateSession(next);
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("companyForm.saveError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="company-form" onSubmit={submit}>
      <label className="company-logo-field">
        <span>{t("companyForm.logo")}</span>
        <span className="company-logo-preview">
          {logoUrl ? <img src={logoUrl} alt="" /> : <strong>{name.slice(0, 2).toUpperCase()}</strong>}
        </span>
        <span className="company-logo-pick">
          <input type="file" accept="image/*" onChange={(event) => onLogo(event.target.files?.[0])} />
          {logoUrl ? t("companyForm.change") : t("companyForm.upload")}
        </span>
      </label>
      <div className="field-row">
        <label>
          {t("companyForm.name")}
          <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={160} />
        </label>
        <label>
          {t("companyForm.legalName")}
          <input value={legalName} onChange={(event) => setLegalName(event.target.value)} maxLength={160} />
        </label>
      </div>
      <label>
        {t("companyForm.activity")}
        <textarea value={activity} onChange={(event) => setActivity(event.target.value)} required maxLength={600} rows={3} />
      </label>
      <div className="field-row">
        <label>
          {t("companyForm.industry")}
          <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
            {INDUSTRIES.map((item) => (
              <option key={item} value={item}>{industryLabel(locale, item)}</option>
            ))}
          </select>
        </label>
        <label>
          {t("companyForm.country")}
          <select value={country} onChange={(event) => setCountry(event.target.value)}>
            {COUNTRIES.map((item) => (
              <option key={item} value={item}>{countryLabel(locale, item)}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="field-row">
        <label>
          {t("companyForm.size")}
          <select value={companySize} onChange={(event) => setCompanySize(event.target.value)}>
            <option value="">{t("companyForm.unspecified")}</option>
            {COMPANY_SIZES.map((item) => (
              <option key={item} value={item}>{t("companyForm.people", { size: sizeLabel(locale, item) })}</option>
            ))}
          </select>
        </label>
        <label>
          {t("companyForm.city")}
          <input value={city} onChange={(event) => setCity(event.target.value)} maxLength={80} />
        </label>
      </div>
      <div className="field-row">
        <label>
          {t("companyForm.website")}
          <input value={website} onChange={(event) => setWebsite(event.target.value)} maxLength={300} placeholder="https://" />
        </label>
        <label>
          {t("companyForm.phone")}
          <input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} />
        </label>
      </div>
      <label>
        {t("companyForm.description")}
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={4} />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {saved ? <p className="muted-copy">{t("companyForm.saved")}</p> : null}
      <div className="config-actions">
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? t("common.saving") : t("companyForm.save")}
        </button>
        {logoUrl ? (
          <button className="ghost-button" type="button" onClick={() => setLogoUrl("")}>
            {t("companyForm.remove")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
