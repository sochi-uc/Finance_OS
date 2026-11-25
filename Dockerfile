# syntax=docker/dockerfile:1
# Multi-stage: build the SPA with Node, publish the API with the .NET SDK, run on a chiseled,
# non-root, shell-less ASP.NET runtime image.

FROM node:22-alpine AS web
WORKDIR /src/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npx tsc --noEmit && npx vite build --outDir /out/wwwroot --emptyOutDir

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api
WORKDIR /src
COPY server/ ./server/
RUN dotnet publish server/src/FinanceOs.Api -c Release -o /out/app /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled
WORKDIR /app
COPY --from=api /out/app ./
COPY --from=web /out/wwwroot ./wwwroot
ENV ASPNETCORE_URLS=http://+:8787     ConnectionStrings__Finance="Data Source=/app/App_Data/finance.db"
EXPOSE 8787
# App_Data holds the SQLite DB and Data Protection keys: mount a volume there.
VOLUME ["/app/App_Data"]
USER $APP_UID
ENTRYPOINT ["dotnet", "FinanceOs.Api.dll"]
