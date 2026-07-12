"""
models_db.py — Modèles SQLAlchemy (remplacent les tables Supabase).
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    nom = Column(String, nullable=False)
    type_compte = Column(String, default="Particulier")
    role = Column(String, default="Utilisateur")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_sign_in_at = Column(DateTime, nullable=True)

    sites = relationship("Site", back_populates="owner")


class Site(Base):
    __tablename__ = "sites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom = Column(String, nullable=False)
    localisation = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="sites")
    machines = relationship("Machine", back_populates="site")


class Machine(Base):
    __tablename__ = "machines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code_interne = Column(String, unique=True, nullable=False)
    nom = Column(String, nullable=False)
    puissance_nominale_kw = Column(Float, nullable=False)
    status = Column(String, default="actif")
    priority = Column(String, default="moyenne")
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    site = relationship("Site", back_populates="machines")


class SensorMetric(Base):
    __tablename__ = "sensor_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    machine_id = Column(UUID(as_uuid=True), ForeignKey("machines.id"), nullable=False)
    power_kw = Column(Float)
    temperature_c = Column(Float)
    vibration_hz = Column(Float)
    pressure_bar = Column(Float)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action = Column(String)
    ref_hash = Column(String)
    status = Column(String)


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    month = Column(String)
    amount_xof = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class AIAlert(Base):
    __tablename__ = "ai_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    machine_id = Column(UUID(as_uuid=True), ForeignKey("machines.id"), nullable=False)
    type_alerte = Column(String)
    description = Column(Text)
    action_recommandee = Column(Text)
    gain_estime_fcfa = Column(Float)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
