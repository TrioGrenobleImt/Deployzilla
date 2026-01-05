# DeployZilla

DeployZilla est une plateforme CI/CD sécurisée permettant de piloter des pipelines de build et de déploiement depuis une interface web centralisée.

Le projet fournit une surcouche applicative au-dessus de pipelines existants (GitHub Actions), avec une gestion fine des accès, un suivi temps réel des étapes et une intégration complète avec Docker.

## Fonctionnalités principales

- Authentification OAuth2 (Google)
- Gestion des rôles utilisateurs (admin, developer, viewer)
- Lancement de pipelines CI/CD depuis l’IHM
- Suivi temps réel des pipelines via WebSockets
- Centralisation des logs d’exécution
- Déploiement automatique sur une VM via Docker
- Rollback automatique en cas d’échec
- Intégration SonarQube pour l’analyse de la qualité du code

## Architecture générale

- Frontend web (React)
- Backend API (Node.js)
- Base de données MongoDB
- Pipelines GitHub Actions
- VM de production Linux avec Docker

L’ensemble de la plateforme CI/CD est entièrement dockerisé afin de garantir la reproductibilité et la portabilité.

## Stack technique

- Frontend : React, WebSockets
- Backend : Node.js
- Base de données : MongoDB
- CI/CD : GitHub Actions
- Conteneurisation : Docker, Docker Compose
- Qualité de code : SonarQube

## Lancement en local

Pré-requis :
- Docker
- Docker Compose

Démarrage de la plateforme CI/CD :

docker compose up

L’application est alors accessible en local avec authentification OAuth2.

## Objectif pédagogique

Ce projet a été réalisé dans le cadre d’un projet Cloud Sécurisé.
L’objectif est de démontrer la mise en place complète d’une chaîne CI/CD moderne incluant :
- intégration continue
- déploiement continu
- sécurité des identités
- traçabilité et supervision
- automatisation des déploiements

DeployZilla ne cherche pas à réinventer un moteur CI/CD, mais à fournir une plateforme sécurisée et observable pour orchestrer et superviser des pipelines industriels existants.
