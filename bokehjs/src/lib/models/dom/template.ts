import {DOMElement, DOMElementView} from "./dom_element"
import {Action} from "./action"
import {PlaceholderView} from "./placeholder"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Index as DataIndex} from "core/util/templating"
import {ViewStorage, build_views, remove_views} from "core/build_views"
import * as p from "core/properties"

export class TemplateView extends DOMElementView {
  override model: Template
  static override tag_name = "div" as const

  action_views: ViewStorage<Action> = new Map()

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this.action_views, this.model.actions, {parent: this})
  }

  override remove(): void {
    remove_views(this.action_views)
    super.remove()
  }

  update(source: ColumnarDataSource, i: DataIndex | null, vars: object = {}/*, formatters?: Formatters*/): void {
    function descend(obj: DOMElementView): void {
      for (const child of obj.child_views.values()) {
        if (child instanceof PlaceholderView) {
          child.update(source, i, vars)
        } else if (child instanceof DOMElementView) {
          descend(child)
        }
      }
    }

    descend(this)

    for (const action of this.action_views.values()) {
      action.update(source, i, vars)
    }
  }
}

export namespace Template {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMElement.Props & {
    actions: p.Property<Action[]>
  }
}

export interface Template extends Template.Attrs {}

export class Template extends DOMElement {
  override properties: Template.Props
  override __view_type__: TemplateView

  static {
    this.prototype.default_view = TemplateView
    this.define<Template.Props>(({Array, Ref}) => ({
      actions: [ Array(Ref(Action)), [] ],
    }))
  }
}
