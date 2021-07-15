import { fieldsByQueryType } from './jira.queryTypes';
import { IJiraQueryCustomField, IJiraQueryResposeSprint, IJiraQuery } from '../jira.types';
import { logger } from '../../../shared/logger';

function parseJiraSprint(data: string) {
  if (data == null) {
    return
  }

  const name = data.match(/name=([^,]*)/)![1]
  const status = data.match(/state=([^,]*)/)![1]
  const id = data.match(/id=([^,]*)/)![1]

  return {name, status, id}
}

export function getJiraQuerySearchUrl(url:String, apiVersion: string, jiraQuery: IJiraQuery){
    let urlJiraQuery = url.concat(`/rest/api/${apiVersion}/search?jql=${jiraQuery.filter}`);
    const fields = fieldsByQueryType[jiraQuery.type];
    const customFields:IJiraQueryCustomField[] = jiraQuery.customFields;
    const hasCustomFields = customFields && customFields.length > 0;

    if(fields || hasCustomFields){
        urlJiraQuery = urlJiraQuery.concat('&fields=');
        if(fields){
          urlJiraQuery = urlJiraQuery.concat(`${fields}`);
        }
        if(hasCustomFields){
          let queryParamsCustomFields = '';
          for(const field of customFields){
            logger.info(`Custom field key: ${field.key} | Custom field name: ${field.name}`);
            queryParamsCustomFields = queryParamsCustomFields.concat(`, ${field.key}`);
          }
          urlJiraQuery = urlJiraQuery.concat(`${queryParamsCustomFields}`);
        }
    }

    return urlJiraQuery;
}

export function getPropertiesForCustomFields(customFields:IJiraQueryCustomField[], issue: any){
    const ipointTags:any = {};
    const ipointFields:any = {};
    const hasCustomFields = customFields && customFields.length > 0;
    if (hasCustomFields) {
        for (const field of customFields) {
          if (field.name == 'sprint') {            
            const firstSprint:IJiraQueryResposeSprint = issue.fields[field.key]?.map(parseJiraSprint).reduce((prev:IJiraQueryResposeSprint, current:IJiraQueryResposeSprint) => (prev.id < current.id) ? prev : current);
            const lastSprint:IJiraQueryResposeSprint = issue.fields[field.key]?.map(parseJiraSprint).reduce((prev:IJiraQueryResposeSprint, current:IJiraQueryResposeSprint) => (prev.id > current.id) ? prev : current);
            ipointTags[field.name] = firstSprint?.name || field.defaultValue || null; 
            ipointFields[field.name] = firstSprint?.name || field.defaultValue || null;
            
            ipointTags["lastSprint"] = lastSprint?.name || field.defaultValue || null;
            ipointFields["lastSprint"] = lastSprint?.name || field.defaultValue || null; 
          } else {
            ipointTags[field.name] = issue.fields[field.key]?.value || field.defaultValue || null;
            ipointFields[field.name] = issue.fields[field.key]?.value || field.defaultValue || null;
          }
        }
    }
    return {
        "ipointTags": ipointTags,
        "ipointFields": ipointFields
    };
}