{{/*
─────────────────────────────────────────────────────────────────────────────
_helpers.tpl  –  Reusable named templates for CricBook Helm chart
─────────────────────────────────────────────────────────────────────────────
*/}}

{{/*
Chart name (trimmed to 63 chars per DNS spec)
*/}}
{{- define "cricbook.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common Kubernetes labels applied to every resource
*/}}
{{- define "cricbook.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/part-of: cricbook
{{- end }}

{{/*
Selector labels for a named workload
Usage: {{ include "cricbook.selectorLabels" "auth-service" }}
*/}}
{{- define "cricbook.selectorLabels" -}}
app: {{ . }}
{{- end }}

{{/*
─────────────────────────────────────────────────────────────────────────────
Envoy sidecar static bootstrap config
─────────────────────────────────────────────────────────────────────────────
Generates the envoy.yaml content for a specific microservice.
The sidecar listens on :15001 and forwards to 127.0.0.1:<appPort>.
Metrics are exposed on :9901.

Usage (inside a ConfigMap data block):
  {{ include "cricbook.envoyConfig" (dict "port" 4001) | nindent 4 }}
*/}}
{{- define "cricbook.envoyConfig" -}}
admin:
  address:
    socket_address:
      address: 0.0.0.0
      port_value: 9901
static_resources:
  listeners:
  - name: inbound_listener
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 15001
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: ingress_http
          access_log:
          - name: envoy.access_loggers.stdout
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.access_loggers.stream.v3.StdoutAccessLog
          http_filters:
          - name: envoy.filters.http.router
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
          route_config:
            name: local_route
            virtual_hosts:
            - name: local_service
              domains: ["*"]
              routes:
              - match:
                  prefix: "/"
                route:
                  cluster: local_app
                  timeout: 30s
  clusters:
  - name: local_app
    connect_timeout: 5s
    type: STATIC
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: local_app
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: 127.0.0.1
                port_value: {{ .port }}
{{- end }}

{{/*
─────────────────────────────────────────────────────────────────────────────
Envoy sidecar container spec
─────────────────────────────────────────────────────────────────────────────
Usage inside a pod spec (containers list):
  {{- include "cricbook.envoySidecar" (dict "svcName" "auth-service" "Values" .Values) | nindent 8 }}
*/}}
{{- define "cricbook.envoySidecar" -}}
- name: envoy-proxy
  image: {{ .Values.envoy.image }}
  args:
    - -c
    - /etc/envoy/envoy.yaml
    - --log-level
    - warn
  ports:
    - name: envoy-inbound
      containerPort: 15001
      protocol: TCP
    - name: envoy-admin
      containerPort: 9901
      protocol: TCP
  env:
    - name: POD_NAME
      valueFrom:
        fieldRef:
          fieldPath: metadata.name
    - name: POD_NAMESPACE
      valueFrom:
        fieldRef:
          fieldPath: metadata.namespace
  volumeMounts:
    - name: envoy-config
      mountPath: /etc/envoy
  resources:
    {{- toYaml .Values.envoy.resources | nindent 4 }}
  readinessProbe:
    httpGet:
      path: /ready
      port: 9901
    initialDelaySeconds: 5
    periodSeconds: 10
  livenessProbe:
    httpGet:
      path: /ready
      port: 9901
    initialDelaySeconds: 10
    periodSeconds: 30
{{- end }}

{{/*
─────────────────────────────────────────────────────────────────────────────
Envoy config volume (references the per-service key in the shared ConfigMap)
─────────────────────────────────────────────────────────────────────────────
Usage inside a pod spec (volumes list):
  {{- include "cricbook.envoyVolume" "auth-service" | nindent 8 }}
*/}}
{{- define "cricbook.envoyVolume" -}}
- name: envoy-config
  configMap:
    name: cricbook-envoy-configs
    items:
      - key: {{ . }}-envoy.yaml
        path: envoy.yaml
{{- end }}

{{/*
Common DB env vars pulled from the Secret
*/}}
{{- define "cricbook.dbEnv" -}}
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: cricbook-db-secret
      key: DATABASE_URL
- name: PORT
  valueFrom:
    configMapKeyRef:
      name: cricbook-config
      key: {{ . }}
{{- end }}
