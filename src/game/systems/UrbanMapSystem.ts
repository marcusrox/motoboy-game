import { GameObjects, Physics, Scene } from 'phaser';
import { ASSET_KEYS } from '../config/assetManifest';
import {
    CITY_BARRIERS,
    CITY_BLOCKS,
    CityBarrier,
    CityBlock,
    CROSSWALK_INTERSECTIONS,
    ROAD_SEGMENTS,
    RoadSegment,
    WORLD_HEIGHT,
    WORLD_WIDTH
} from '../config/cityMapConfig';

const CROSSWALK_COLOR = 0xe6e3d8;
const CROSSWALK_DEPTH = 38;
const CROSSWALK_EDGE_INSET = 12;
const CROSSWALK_SIDEWALK_OVERLAP = 14;
const CROSSWALK_STRIPE_WIDTH = 22;
const CROSSWALK_STRIPE_GAP = 16;
const NARROW_BUILDING_MAX_ASPECT = 0.35;

type BuildingTextureFit = 'contain' | 'cover';

interface BuildingTextureSelection
{
    key: string;
    fit: BuildingTextureFit;
}

interface RoadMarkingStyle
{
    asphaltColor: number;
    lineColor: number;
    crossSectionSize: number;
    lineWidth: number;
    textureLength: number;
    markedRanges: Array<[number, number]>;
}

const WIDE_ROAD_STYLE: RoadMarkingStyle = {
    asphaltColor: 0x404346,
    lineColor: 0xd7a437,
    crossSectionSize: 320,
    lineWidth: 8,
    textureLength: 320,
    markedRanges: [
        [0, 24],
        [53, 85],
        [113, 145],
        [173, 205],
        [233, 265],
        [293, 319]
    ]
};

const NARROW_ROAD_STYLE: RoadMarkingStyle = {
    asphaltColor: 0x3e4043,
    lineColor: 0xe8a607,
    crossSectionSize: 160,
    lineWidth: 2,
    textureLength: 320,
    markedRanges: [
        [18, 38],
        [63, 84],
        [108, 129],
        [153, 174],
        [198, 219],
        [244, 264],
        [289, 309]
    ]
};

export class UrbanMapSystem
{
    constructor (
        private scene: Scene,
        private colliders: Physics.Arcade.StaticGroup
    ) {}

    build ()
    {
        this.createVisualLayer();
        this.createCollisionLayer();
    }

    private createVisualLayer ()
    {
        const graphics = this.scene.add.graphics();

        graphics.fillStyle(0xb7b2a6);
        graphics.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        ROAD_SEGMENTS.forEach((road) => this.createRoadVisual(graphics, road));
        this.createIntersectionVisuals();
        CITY_BLOCKS.forEach((block) => this.createBuildingVisual(block));
        this.createAlleyVisual(graphics);
        this.createOpenAreaVisual(graphics);
    }

    private createCollisionLayer ()
    {
        CITY_BLOCKS.forEach((block) => {
            const inset = this.buildingInset(block);

            this.addInvisibleCollider(
                block.x + block.width / 2,
                block.y + block.height / 2,
                block.width - inset * 2,
                block.height - inset * 2
            );
        });
        CITY_BARRIERS.forEach((barrier) => {
            this.addInvisibleCollider(barrier.x, barrier.y, barrier.width, barrier.height);
        });
    }

    private createRoadVisual (graphics: GameObjects.Graphics, road: RoadSegment)
    {
        const texture = road.wide ? ASSET_KEYS.roadWide : ASSET_KEYS.roadNarrow;

        if (this.scene.textures.exists(texture))
        {
            const vertical = road.height > road.width;
            const crossSection = vertical ? road.width : road.height;
            const textureCrossSection = this.roadMarkingStyle(road).crossSectionSize;
            const centeredCropOffset = Math.max(0, (textureCrossSection - crossSection) / 2);

            this.scene.add.tileSprite(
                road.x + road.width / 2,
                road.y + road.height / 2,
                vertical ? road.width : road.height,
                vertical ? road.height : road.width,
                texture
            )
                .setTilePosition(centeredCropOffset, 0)
                .setRotation(vertical ? 0 : Math.PI / 2)
                .setDepth(0);
            return;
        }

        graphics.fillStyle(road.wide ? 0x30373d : 0x384047);
        graphics.fillRect(road.x, road.y, road.width, road.height);
        graphics.lineStyle(road.wide ? 6 : 4, 0xe7c85a, 0.75);

        if (road.height > road.width)
        {
            const centerX = road.x + road.width / 2;

            for (let markerY = road.y + 25; markerY < road.y + road.height; markerY += 110)
            {
                graphics.lineBetween(centerX, markerY, centerX, markerY + 55);
            }
        }
        else
        {
            const centerY = road.y + road.height / 2;

            for (let markerX = road.x + 25; markerX < road.x + road.width; markerX += 110)
            {
                graphics.lineBetween(markerX, centerY, markerX + 55, centerY);
            }
        }
    }

    private createIntersectionVisuals ()
    {
        const graphics = this.scene.add.graphics().setDepth(0.5);
        const verticalRoads = ROAD_SEGMENTS.filter((road) => road.height > road.width);
        const horizontalRoads = ROAD_SEGMENTS.filter((road) => road.width > road.height);

        for (const vertical of verticalRoads)
        {
            for (const horizontal of horizontalRoads)
            {
                const left = Math.max(vertical.x, horizontal.x);
                const top = Math.max(vertical.y, horizontal.y);
                const right = Math.min(vertical.x + vertical.width, horizontal.x + horizontal.width);
                const bottom = Math.min(vertical.y + vertical.height, horizontal.y + horizontal.height);

                if (right > left && bottom > top)
                {
                    graphics.fillStyle(this.intersectionAsphaltColor(vertical, horizontal));
                    graphics.fillRect(left, top, right - left, bottom - top);

                    if (this.hasCrosswalk(vertical, horizontal))
                    {
                        this.drawCrosswalks(graphics, left, top, right, bottom);
                    }
                    else
                    {
                        this.drawIntersectionGuides(
                            graphics,
                            vertical,
                            horizontal,
                            left,
                            top,
                            right,
                            bottom
                        );
                    }
                }
            }
        }
    }

    private createBuildingVisual (block: CityBlock)
    {
        const inset = this.buildingInset(block);
        const centerX = block.x + block.width / 2;
        const centerY = block.y + block.height / 2;
        const buildingWidth = block.width - inset * 2;
        const buildingHeight = block.height - inset * 2;

        if (this.scene.textures.exists(ASSET_KEYS.sidewalk))
        {
            this.scene.add.tileSprite(centerX, centerY, block.width, block.height, ASSET_KEYS.sidewalk)
                .setDepth(0);
        }
        else
        {
            this.scene.add.rectangle(centerX, centerY, block.width, block.height, 0xc8c3b8)
                .setStrokeStyle(5, 0xe2ded5)
                .setDepth(0);
        }

        const buildingTexture = this.chooseBuildingTexture(
            block,
            buildingWidth,
            buildingHeight
        );

        if (buildingTexture)
        {
            this.createBuildingTexture(
                centerX,
                centerY,
                buildingWidth,
                buildingHeight,
                buildingTexture.key,
                buildingTexture.fit
            );
        }
        else
        {
            this.scene.add.rectangle(centerX, centerY, buildingWidth, buildingHeight, block.color ?? 0x6f665e)
                .setStrokeStyle(8, 0x383532)
                .setDepth(2);
            this.scene.add.rectangle(
                centerX,
                centerY,
                Math.max(24, buildingWidth - 30),
                Math.max(24, buildingHeight - 30),
                0xffffff,
                0.07
            ).setDepth(3);
        }
    }

    private createAlleyVisual (graphics: GameObjects.Graphics)
    {
        graphics.fillStyle(0x4a4d4e);
        graphics.fillRect(770, 1120, 80, 680);
        graphics.lineStyle(3, 0x777b79, 0.8);

        for (let y = 1150; y < 1800; y += 70)
        {
            graphics.lineBetween(783, y, 837, y);
        }
    }

    private createOpenAreaVisual (graphics: GameObjects.Graphics)
    {
        if (this.scene.textures.exists(ASSET_KEYS.plaza))
        {
            this.scene.add.tileSprite(1680, 2290, 560, 500, ASSET_KEYS.plaza).setDepth(0);
        }
        else
        {
            graphics.fillStyle(0x9e9a8f);
            graphics.fillRect(1400, 2040, 560, 500);
            graphics.lineStyle(3, 0xb8b4aa, 0.8);

            for (let x = 1420; x < 1960; x += 70)
            {
                graphics.lineBetween(x, 2040, x, 2540);
            }

            for (let y = 2060; y < 2540; y += 70)
            {
                graphics.lineBetween(1400, y, 1960, y);
            }
        }

        CITY_BARRIERS.forEach((barrier) => this.createBarrierVisual(barrier));
    }

    private createBarrierVisual (barrier: CityBarrier)
    {
        this.scene.add.rectangle(barrier.x, barrier.y, barrier.width, barrier.height, 0x466646)
            .setStrokeStyle(7, 0x745b3d)
            .setDepth(2);
    }

    private hasCrosswalk (vertical: RoadSegment, horizontal: RoadSegment)
    {
        return CROSSWALK_INTERSECTIONS.some((intersection) => (
            intersection.verticalRoadX === vertical.x
            && intersection.horizontalRoadY === horizontal.y
        ));
    }

    private drawCrosswalks (
        graphics: GameObjects.Graphics,
        left: number,
        top: number,
        right: number,
        bottom: number
    )
    {
        const crossingLeft = left - CROSSWALK_SIDEWALK_OVERLAP;
        const crossingRight = right + CROSSWALK_SIDEWALK_OVERLAP;
        const topCrosswalkY = top + CROSSWALK_EDGE_INSET;
        const bottomCrosswalkY = bottom - CROSSWALK_EDGE_INSET - CROSSWALK_DEPTH;

        graphics.fillStyle(CROSSWALK_COLOR, 0.8);

        for (
            let x = crossingLeft;
            x < crossingRight;
            x += CROSSWALK_STRIPE_WIDTH + CROSSWALK_STRIPE_GAP
        )
        {
            const stripeWidth = Math.min(CROSSWALK_STRIPE_WIDTH, crossingRight - x);

            graphics.fillRect(x, topCrosswalkY, stripeWidth, CROSSWALK_DEPTH);
            graphics.fillRect(x, bottomCrosswalkY, stripeWidth, CROSSWALK_DEPTH);
        }
    }

    private drawIntersectionGuides (
        graphics: GameObjects.Graphics,
        vertical: RoadSegment,
        horizontal: RoadSegment,
        left: number,
        top: number,
        right: number,
        bottom: number
    )
    {
        this.drawDashedGuide(
            graphics,
            vertical,
            vertical.x + vertical.width / 2,
            top,
            bottom,
            true
        );
        this.drawDashedGuide(
            graphics,
            horizontal,
            horizontal.y + horizontal.height / 2,
            left,
            right,
            false
        );
    }

    private drawDashedGuide (
        graphics: GameObjects.Graphics,
        road: RoadSegment,
        fixedPosition: number,
        start: number,
        end: number,
        vertical: boolean
    )
    {
        const style = this.roadMarkingStyle(road);
        let segmentStart: number | null = null;

        graphics.lineStyle(style.lineWidth, style.lineColor, 1);

        for (let position = Math.floor(start); position <= Math.ceil(end); position += 1)
        {
            const sourcePosition = vertical
                ? position - road.y
                : road.width - (position - road.x);
            const texturePosition = (
                (sourcePosition % style.textureLength) + style.textureLength
            ) % style.textureLength;
            const marked = style.markedRanges.some(([rangeStart, rangeEnd]) => (
                texturePosition >= rangeStart && texturePosition <= rangeEnd
            ));

            if (marked && segmentStart === null)
            {
                segmentStart = Math.max(start, position);
            }
            else if (!marked && segmentStart !== null)
            {
                this.drawGuideSegment(
                    graphics,
                    fixedPosition,
                    segmentStart,
                    Math.min(end, position),
                    vertical
                );
                segmentStart = null;
            }
        }

        if (segmentStart !== null)
        {
            this.drawGuideSegment(graphics, fixedPosition, segmentStart, end, vertical);
        }
    }

    private drawGuideSegment (
        graphics: GameObjects.Graphics,
        fixedPosition: number,
        start: number,
        end: number,
        vertical: boolean
    )
    {
        if (vertical)
        {
            graphics.lineBetween(fixedPosition, start, fixedPosition, end);
        }
        else
        {
            graphics.lineBetween(start, fixedPosition, end, fixedPosition);
        }
    }

    private intersectionAsphaltColor (vertical: RoadSegment, horizontal: RoadSegment)
    {
        const first = this.roadMarkingStyle(vertical).asphaltColor;
        const second = this.roadMarkingStyle(horizontal).asphaltColor;
        const red = (((first >> 16) & 0xff) + ((second >> 16) & 0xff)) >> 1;
        const green = (((first >> 8) & 0xff) + ((second >> 8) & 0xff)) >> 1;
        const blue = ((first & 0xff) + (second & 0xff)) >> 1;

        return (red << 16) | (green << 8) | blue;
    }

    private roadMarkingStyle (road: RoadSegment)
    {
        return road.wide ? WIDE_ROAD_STYLE : NARROW_ROAD_STYLE;
    }

    private addInvisibleCollider (x: number, y: number, width: number, height: number)
    {
        const collider = this.scene.add.rectangle(x, y, width, height, 0x000000, 0)
            .setVisible(false);

        this.colliders.add(collider);
    }

    private chooseBuildingTexture (
        block: CityBlock,
        buildingWidth: number,
        buildingHeight: number
    ): BuildingTextureSelection | null
    {
        const aspect = buildingWidth / buildingHeight;

        if (
            aspect <= NARROW_BUILDING_MAX_ASPECT
            && this.scene.textures.exists(ASSET_KEYS.buildingNarrow)
        )
        {
            return {
                key: ASSET_KEYS.buildingNarrow,
                fit: 'contain'
            };
        }

        const longestSide = Math.max(block.width, block.height);
        const key = longestSide >= 650
            ? ASSET_KEYS.buildingLarge
            : longestSide >= 400
                ? ASSET_KEYS.buildingMedium
                : ASSET_KEYS.buildingSmall;

        return this.scene.textures.exists(key) ? { key, fit: 'cover' } : null;
    }

    private createBuildingTexture (
        x: number,
        y: number,
        width: number,
        height: number,
        texture: string,
        fit: BuildingTextureFit
    )
    {
        const image = this.scene.add.image(x, y, texture).setDepth(2);
        const scale = fit === 'contain'
            ? Math.min(width / image.width, height / image.height)
            : Math.max(width / image.width, height / image.height);

        if (fit === 'contain')
        {
            image.setScale(scale);
            return;
        }

        const cropWidth = Math.min(image.width, width / scale);
        const cropHeight = Math.min(image.height, height / scale);

        image
            .setCrop(
                (image.width - cropWidth) / 2,
                (image.height - cropHeight) / 2,
                cropWidth,
                cropHeight
            )
            .setScale(scale);
    }

    private buildingInset (block: CityBlock)
    {
        return Math.min(34, block.width * 0.12, block.height * 0.12);
    }
}
