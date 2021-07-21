import * as React from 'react';
import { SEO } from '../../models/PanelSettings';
import { ArticleDetails } from './ArticleDetails';
import { Icon } from './Icon';
import { SeoDetails } from './SeoDetails';

export interface ISeoStatusProps {
  seo: SEO;
  data: any;
}

export const SeoStatus: React.FunctionComponent<ISeoStatusProps> = (props: React.PropsWithChildren<ISeoStatusProps>) => {
  const { data, seo } = props;
  const { title } = data;

  const { descriptionField } = seo;

  if (!title && !data[descriptionField]) {
    return null;
  }

  return (
    <div className="section seo__status">
      <h3>
        <Icon name="search" /> SEO Status
      </h3>

      { (title && seo.title > 0) && <SeoDetails title="Title" valueTitle="Length" allowedLength={seo.title} value={title.length} /> }
      
      { (data[descriptionField] && seo.description > 0) && <SeoDetails title="Description" valueTitle="Length" allowedLength={seo.description} value={data[descriptionField].length} /> }

      {
        seo.content > 0 && data?.articleDetails?.wordCount && (
          <SeoDetails title="Article length" 
                      valueTitle="Words" 
                      allowedLength={seo.content} 
                      value={data?.articleDetails?.wordCount}
                      noValidation />
        )
      }

      <ArticleDetails details={data.articleDetails} />
    </div>
  );
};