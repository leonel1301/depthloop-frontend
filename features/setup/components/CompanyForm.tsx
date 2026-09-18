"use client";

import { FormEvent, useState } from "react";
import { COMPANY_SIZES, COUNTRIES, INDUSTRIES } from "@/features/auth/catalog";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { authApi } from "@/features/auth/services/authApi";

export function CompanyForm() {
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
      setError("El logo debe ser una imagen.");
      return;
    }
    if (file.size > 280_000) {
      setError("El logo debe pesar menos de 280 KB.");
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
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el negocio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="company-form" onSubmit={submit}>
      <label className="company-logo-field">
        <span>Logo</span>
        <span className="company-logo-preview">
          {logoUrl ? <img src={logoUrl} alt="" /> : <strong>{name.slice(0, 2).toUpperCase()}</strong>}
        </span>
        <span className="company-logo-pick">
          <input type="file" accept="image/*" onChange={(event) => onLogo(event.target.files?.[0])} />
          {logoUrl ? "Cambiar imagen" : "Subir logo"}
        </span>
      </label>
      <div className="field-row">
        <label>
          Nombre comercial
          <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={160} />
        </label>
        <label>
          Razón social
          <input value={legalName} onChange={(event) => setLegalName(event.target.value)} maxLength={160} />
        </label>
      </div>
      <label>
        Actividad
        <textarea value={activity} onChange={(event) => setActivity(event.target.value)} required maxLength={600} rows={3} />
      </label>
      <div className="field-row">
        <label>
          Rubro
          <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
            {INDUSTRIES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          País
          <select value={country} onChange={(event) => setCountry(event.target.value)}>
            {COUNTRIES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="field-row">
        <label>
          Tamaño
          <select value={companySize} onChange={(event) => setCompanySize(event.target.value)}>
            <option value="">Sin especificar</option>
            {COMPANY_SIZES.map((item) => (
              <option key={item} value={item}>{item} personas</option>
            ))}
          </select>
        </label>
        <label>
          Ciudad
          <input value={city} onChange={(event) => setCity(event.target.value)} maxLength={80} />
        </label>
      </div>
      <div className="field-row">
        <label>
          Sitio web
          <input value={website} onChange={(event) => setWebsite(event.target.value)} maxLength={300} placeholder="https://" />
        </label>
        <label>
          Teléfono
          <input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} />
        </label>
      </div>
      <label>
        Descripción
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={4} />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {saved ? <p className="muted-copy">Cambios guardados.</p> : null}
      <div className="config-actions">
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Guardando…" : "Guardar negocio"}
        </button>
        {logoUrl ? (
          <button className="ghost-button" type="button" onClick={() => setLogoUrl("")}>
            Quitar logo
          </button>
        ) : null}
      </div>
    </form>
  );
}
